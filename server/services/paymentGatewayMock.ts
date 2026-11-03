/**
 * IEEE SWEBOK v4 Chapter 02 (Encapsulation & Secure Integration) & Chapter 13 (Software Security)
 * Abstraction layer for PCI-DSS Level 1 Compliant Payment Gateway.
 * Strict principle: Credit card numbers NEVER touch the merchant web server.
 * Only client-tokenized one-time tokens ('tok_...') are processed here.
 */

export interface PaymentProcessRequest {
  token: string;
  amountInCents: number;
  currency: string;
  orderNumber: string;
  customerEmail: string;
}

export interface PaymentProcessResult {
  success: boolean;
  transactionId: string;
  gateway: 'STRIPE_PCI_MOCK' | 'BRAINTREE_PCI_MOCK';
  amountCapturedInCents: number;
  errorCode?: string;
  errorMessage?: string;
}

export class PaymentGatewayService {
  /**
   * Process client-side tokenized payment.
   */
  public async chargeToken(request: PaymentProcessRequest): Promise<PaymentProcessResult> {
    const { token, amountInCents } = request;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulated test decline tokens
    if (token === 'tok_declined' || token.includes('fail')) {
      return {
        success: false,
        transactionId: `txn_failed_${Date.now()}`,
        gateway: 'STRIPE_PCI_MOCK',
        amountCapturedInCents: 0,
        errorCode: 'CARD_DECLINED',
        errorMessage: 'The payment transaction was declined by the issuing institution.',
      };
    }

    if (token === 'tok_insufficient_funds') {
      return {
        success: false,
        transactionId: `txn_insufficient_${Date.now()}`,
        gateway: 'STRIPE_PCI_MOCK',
        amountCapturedInCents: 0,
        errorCode: 'INSUFFICIENT_FUNDS',
        errorMessage: 'Insufficient funds for this transaction.',
      };
    }

    // Defensive check: Token must begin with tok_
    if (!token.startsWith('tok_')) {
      return {
        success: false,
        transactionId: `txn_invalid_${Date.now()}`,
        gateway: 'STRIPE_PCI_MOCK',
        amountCapturedInCents: 0,
        errorCode: 'INVALID_TOKEN',
        errorMessage: 'Payment token does not conform to PCI tokenization format.',
      };
    }

    // Success
    return {
      success: true,
      transactionId: `ch_pci_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      gateway: 'STRIPE_PCI_MOCK',
      amountCapturedInCents: amountInCents,
    };
  }
}

export const paymentGateway = new PaymentGatewayService();

