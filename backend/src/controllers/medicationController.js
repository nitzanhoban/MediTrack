const { validationResult } = require('express-validator');
const { withTransaction } = require('../config/db');
const medicationModel = require('../models/medicationModel');
const transactionModel = require('../models/transactionModel');
const { predictShortage, StockStatus } = require('../algorithm/shortagePrediction');

function serialize(med) {
  const prediction = predictShortage({
    currentStock: med.current_stock,
    alertThresholdDays: med.alert_threshold_days,
    totalWithdrawn30d: med.total_withdrawn_30d,
  });
  return {
    medicationId: med.medication_id,
    name: med.name,
    currentStock: med.current_stock,
    alertThresholdDays: med.alert_threshold_days,
    department: med.department,
    status: prediction.status,
    daysRemaining: prediction.daysRemaining,
    dailyConsumptionRate: prediction.dailyRate,
    totalWithdrawn30d: med.total_withdrawn_30d,
    updatedAt: med.updated_at,
  };
}

async function list(req, res) {
  const { department } = req.query;
  const meds = await medicationModel.listActive({ department });
  return res.json({ medications: meds.map(serialize) });
}

async function departments(req, res) {
  const depts = await medicationModel.listDistinctDepartments();
  return res.json({ departments: depts });
}

async function alerts(req, res) {
  const meds = await medicationModel.listActive({});
  const serialized = meds.map(serialize).filter((m) => m.status !== StockStatus.GREEN);
  return res.json({ alerts: serialized });
}

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, currentStock = 0, alertThresholdDays = 5, department } = req.body;
  const med = await medicationModel.create({
    name,
    currentStock,
    alertThresholdDays,
    department: department || null,
    status: currentStock <= 0 ? StockStatus.RED : StockStatus.GREEN,
  });

  const full = await medicationModel.getActiveById(med.medication_id);
  return res.status(201).json({ medication: serialize(full) });
}

async function remove(req, res) {
  const { id } = req.params;
  const deleted = await medicationModel.softDelete(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Medication not found' });
  }
  return res.status(204).send();
}


async function applyStockChange(req, res, { type, sign }) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { id } = req.params;
  const { quantity, department } = req.body;

  try {
    const updated = await withTransaction(async (client) => {
      const med = await medicationModel.getForUpdate(client, id);
      if (!med) {
        const notFound = new Error('Medication not found');
        notFound.status = 404;
        throw notFound;
      }

      const newStock = med.current_stock + sign * quantity;
      if (newStock < 0) {
        const badRequest = new Error('Insufficient stock for this withdrawal');
        badRequest.status = 400;
        throw badRequest;
      }

      await transactionModel.insert(client, {
        medicationId: id,
        userId: req.user.id,
        quantity,
        department: department || med.department,
        type,
      });

      const total30d = await transactionModel.sumWithdrawals30d(id);
      const prediction = predictShortage({
        currentStock: newStock,
        alertThresholdDays: med.alert_threshold_days,
        totalWithdrawn30d: total30d,
      });

      return medicationModel.updateStock(client, id, {
        currentStock: newStock,
        status: prediction.status,
      });
    });

    const full = await medicationModel.getActiveById(updated.medication_id);
    return res.json({ medication: serialize(full) });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

const withdraw = (req, res) => applyStockChange(req, res, { type: transactionModel.WITHDRAWAL, sign: -1 });
const restock = (req, res) => applyStockChange(req, res, { type: transactionModel.RESTOCK, sign: 1 });

module.exports = { list, departments, alerts, create, remove, withdraw, restock, serialize };