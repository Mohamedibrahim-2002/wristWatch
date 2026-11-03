<?php
/**
 * IEEE SWEBOK v4 Automated Test Suite (Native PHP Engine)
 * Zero Node.js / Zero External Dependency Test Runner
 * Run via: php tests/TestRunner.php
 */

declare(strict_types=1);

// Autoload application classes
spl_autoload_register(function ($class) {
    $prefix = 'WristWatch\\';
    $baseDir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) require_once $file;
});

use WristWatch\Services\PricingService;
use WristWatch\Services\AuthService;
use WristWatch\Services\PaymentGateway;

class TestRunner {
    private int $passed = 0;
    private int $failed = 0;

    public function assert(string $description, bool $condition, string $detail = ''): void {
        if ($condition) {
            $this->passed++;
            echo " \033[32m✓\033[0m {$description}\n";
        } else {
            $this->failed++;
            echo " \033[31m✗\033[0m {$description} - FAILED ({$detail})\n";
        }
    }

    public function runAll(): void {
        echo "\n=======================================================\n";
        echo " IEEE SWEBOK v4 PHP Automated Test Suite\n";
        echo "=======================================================\n\n";

        $this->testPricingEngine();
        $this->testSecurityAndRbac();
        $this->testPaymentGatewayAbstraction();

        echo "\n-------------------------------------------------------\n";
        echo " Test Results: {$this->passed} Passed, {$this->failed} Failed\n";
        echo " Total Assertions: " . ($this->passed + $this->failed) . "\n";
        echo "-------------------------------------------------------\n\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function testPricingEngine(): void {
        echo "[SWEBOK v4 Ch. 04: Pricing Engine & Integer Cents Precision]\n";

        // Test 1: Base item price
        $unitPrice = PricingService::calculateItemUnitPriceInCents(145000, null);
        $this->assert('Base price calculation without modifiers', $unitPrice === 145000);

        // Test 2: Customizer component add-ons accumulation
        $config = [
            'caseMaterial' => 'Rose Gold',         // 195000
            'bezel'        => 'Fluted Luxury',     // 40000
            'dialColor'    => 'Emerald Forest',    // 25000
            'hands'        => 'Dauphine',          // 10000
            'strap'        => 'Alligator Leather', // 38000
            'movement'     => 'Automatic',         // 45000
            'engraving'    => 'VANCE 2026',        // 5000
        ];
        $addons = PricingService::calculateCustomizationAddonsInCents($config);
        $expectedAddons = 195000 + 40000 + 25000 + 10000 + 38000 + 45000 + 5000; // 358000
        $this->assert('Customizer add-ons sum exactly in integer cents', $addons === $expectedAddons);

        // Test 3: Total customized watch unit price
        $totalUnit = PricingService::calculateItemUnitPriceInCents(100000, $config);
        $this->assert('Total customized watch unit price equals base + addons', $totalUnit === (100000 + $expectedAddons));

        // Test 4: Promotional coupon discount
        $breakdown = PricingService::computeOrderPricingBreakdown(
            [['basePriceInCents' => 100000, 'quantity' => 2]],
            'HOROLOGY10' // 10% off
        );
        $this->assert('Subtotal computed correctly', $breakdown['subtotalInCents'] === 200000);
        $this->assert('10% coupon correctly computes discount in cents', $breakdown['discountInCents'] === 20000);
        $this->assert('Free shipping unlocked on subtotal >= threshold', $breakdown['isFreeShipping'] === true);
        $this->assert('Exact 8% tax computed on discounted subtotal', $breakdown['taxInCents'] === 14400);

        // Test 5: Orders below free shipping threshold charge flat shipping
        $smallBreakdown = PricingService::computeOrderPricingBreakdown(
            [['basePriceInCents' => 85000, 'quantity' => 1]]
        );
        $this->assert('Orders below threshold incur flat shipping', $smallBreakdown['shippingInCents'] === 2500);
        $this->assert('Tax computed correctly for small order', $smallBreakdown['taxInCents'] === 6800);
        $this->assert('Final total adds subtotal + tax + shipping', $smallBreakdown['finalTotalInCents'] === (85000 + 6800 + 2500));
        echo "\n";
    }

    private function testSecurityAndRbac(): void {
        echo "[SWEBOK v4 Ch. 13: Security & Cryptographic Tokens]\n";

        // Test 6: JWT generation & verification
        $user = ['id' => 'usr_test_1', 'email' => 'test@wristwatch.luxury', 'role' => 'customer', 'full_name' => 'Tester'];
        $token = AuthService::generateToken($user);
        $this->assert('JWT token generated', !empty($token));

        $decoded = AuthService::verifyToken($token);
        $this->assert('Valid JWT token verified and decoded', $decoded !== null && $decoded['email'] === 'test@wristwatch.luxury');

        // Test 7: Tampered JWT token rejected
        $tamperedToken = $token . 'manipulated';
        $tamperedDecoded = AuthService::verifyToken($tamperedToken);
        $this->assert('Tampered JWT token rejected (Signature verification)', $tamperedDecoded === null);

        // Test 8: Empty or invalid JWT rejected
        $this->assert('Malformed JWT rejected', AuthService::verifyToken('invalid.token') === null);
        echo "\n";
    }

    private function testPaymentGatewayAbstraction(): void {
        echo "[SWEBOK v4 Ch. 02 & 13: PCI-DSS Tokenized Gateway Abstraction]\n";

        // Test 9: Valid token authorization
        $charge = PaymentGateway::chargeToken('tok_visa_valid', 150000, 'WW-TEST-001', 'collector@wristwatch.luxury');
        $this->assert('Valid PCI token charged successfully', $charge['success'] === true && !empty($charge['transactionId']));

        // Test 10: Raw PAN credit card number rejected (PCI-DSS compliance)
        $rawCardCharge = PaymentGateway::chargeToken('4111111111111111', 150000, 'WW-TEST-002', 'collector@wristwatch.luxury');
        $this->assert('Raw credit card PAN rejected (must be tok_...)', $rawCardCharge['success'] === false);

        // Test 11: Declined payment token handled gracefully
        $declinedCharge = PaymentGateway::chargeToken('tok_declined', 150000, 'WW-TEST-003', 'collector@wristwatch.luxury');
        $this->assert('Declined token returns clean error code without stack trace', $declinedCharge['success'] === false && $declinedCharge['errorCode'] === 'CARD_DECLINED');
        echo "\n";
    }
}

$runner = new TestRunner();
$runner->runAll();
