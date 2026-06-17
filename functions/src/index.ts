import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

export { culqiCharge } from './culqiCharge'
export { createInvoice } from './createInvoice'
