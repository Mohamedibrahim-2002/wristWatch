<?php
/**
 * IEEE SWEBOK v4 Chapter 02 (Encapsulation) & Chapter 13 (PCI-DSS Compliance)
 * PCI-DSS Compliant Payment Gateway Abstraction.
 * Credit card PAN numbers NEVER touch this server; only one-time client tokens ('tok_...').
 */

declare(strict_types=1);

namespace WristWatch\Services;

class PaymentGateway {
    public static function chargeToken(string $token, int $amountInCents, string $orderNumber, string $customerEmail): array {
        // Defensive check: Token must begin with tok_
        if (!str_starts_with($token, 'tok_')) {
            return [
                'success' => false,
                'errorCode' => 'INVALID_TOKEN',
                'errorMessage' => 'Payment token does not conform to PCI tokenization format.',
            ];
        }

        // Test decline simulations
        if ($token === 'tok_declined' || str_contains($token, 'fail')) {
            return [
                'success' => false,
                'errorCode' => 'CARD_DECLINED',
                'errorMessage' => 'The payment transaction was declined by the issuing institution.',
            ];
        }

        if ($token === 'tok_insufficient_funds') {
            return [
                'success' => false,
                'errorCode' => 'INSUFFICIENT_FUNDS',
                'errorMessage' => 'Insufficient funds for this transaction.',
            ];
        }

        // Success
        $txId = 'ch_pci_' . time() . '_' . bin2hex(random_bytes(4));

        return [
            'success' => true,
            'transactionId' => $txId,
            'gateway' => 'STRIPE_PCI_MOCK',
            'amountCapturedInCents' => $amountInCents,
        ];
    }
}
