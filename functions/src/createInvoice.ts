import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

/**
 * Stub para integración con Nubefact (facturación electrónica SUNAT).
 *
 * Para conectar Nubefact en el futuro:
 * 1. Contrata un plan en https://nubefact.com
 * 2. Obtén tu token API y RUC del emisor
 * 3. Configura el secret NUBEFACT_TOKEN en Firebase Secret Manager
 * 4. Reemplaza el cuerpo de esta función con una llamada POST a:
 *    https://api.nubefact.com/api/v1/{ruc}/generar-comprobante
 * 5. Envía tipo_de_comprobante: 2 (factura) o 3 (boleta) según order.fiscal.tipo
 *
 * Documentación: https://github.com/Nubefact/documentacion-api
 */

interface InvoiceRequest {
  orderId: string
}

export const createInvoice = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Método no permitido' })
    return
  }

  const { orderId } = req.body as InvoiceRequest

  if (!orderId) {
    res.status(400).json({ success: false, message: 'orderId requerido' })
    return
  }

  const db = admin.firestore()
  const orderRef = db.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()

  if (!orderSnap.exists) {
    res.status(404).json({ success: false, message: 'Pedido no encontrado' })
    return
  }

  const order = orderSnap.data()!

  if (order.fiscal?.status === 'emitido') {
    res.status(400).json({ success: false, message: 'Comprobante ya emitido' })
    return
  }

  // STUB: simula emisión exitosa para desarrollo
  // En producción, llamar a la API de Nubefact aquí
  const stubInvoiceNumber =
    order.fiscal.tipo === 'factura' ? `F001-${Date.now()}` : `B001-${Date.now()}`

  await orderRef.update({
    fiscal: {
      ...order.fiscal,
      status: 'emitido',
      invoiceNumber: stubInvoiceNumber,
      emittedAt: Date.now(),
    },
    updatedAt: Date.now(),
  })

  res.json({
    success: true,
    message: 'STUB: Comprobante simulado. Conecta Nubefact para emisión real.',
    invoiceNumber: stubInvoiceNumber,
    orderId,
    fiscalType: order.fiscal.tipo,
    documento: order.fiscal.documento,
  })
})
