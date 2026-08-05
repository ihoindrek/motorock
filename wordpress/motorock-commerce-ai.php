<?php
/**
 * Plugin Name: Motorock Commerce AI
 * Description: Unified Commerce AI Engine for Motorock (skills hub + product content writer).
 * Version: 0.2.0
 *
 * Install into wp-content/mu-plugins/:
 *   1. motorock-commerce-ai.php          (this file)
 *   2. motorock-commerce-ai/             (dashboard + REST)
 *   3. motorock-ai-writer/               (product content writer module)
 *
 * Legacy loader motorock-ai-writer.php still works and forwards here.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/motorock-commerce-ai/motorock-commerce-ai.php';
