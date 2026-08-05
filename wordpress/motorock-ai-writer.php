<?php
/**
 * Plugin Name: Motorock AI Writer
 * Description: Legacy loader — forwards to Motorock Commerce AI Engine.
 * Version: 0.4.2
 *
 * @deprecated Use motorock-commerce-ai.php as the primary mu-plugin loader.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/motorock-commerce-ai.php';
