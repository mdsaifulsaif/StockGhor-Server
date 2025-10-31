const saleModel = require("../models/sale.model");

const addSale = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      items,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
    } = req.body;

   
    const dueAmount = grandTotal - paidAmount;
    let paymentStatus = "pending";

    if (paidAmount === 0) paymentStatus = "pending";
    else if (paidAmount < grandTotal) paymentStatus = "partial";
    else paymentStatus = "paid";

    const sale = await saleModel.create({
      customerId: customerId || null,
      customerName: customerName || "Walk-in Customer",
      items,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
    });

    res.status(201).json({
      success: true,
      message: "Sale added successfully",
      data: sale,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addSale,
};
