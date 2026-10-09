<?php
/**
 * Plugin Name: Motorock DHL Express Shipping
 * Description: WooCommerce shipping method for DHL Express (EU excl. Baltics, NO, CH). Labels via DHL Express Commerce app.
 * Version: 1.0.0
 *
 * Install:
 *   Copy motorock-dhl-express.php and motorock-dhl-express-lib.php to wp-content/mu-plugins/
 *   WooCommerce → Settings → Shipping → your zone → Add shipping method → Motorock DHL Express
 *   Set cost(s). Remove duplicate flat-rate “DHL Express” if present.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/motorock-dhl-express-lib.php';

add_action(
	'woocommerce_shipping_init',
	static function (): void {
		if ( class_exists( 'WC_Shipping_Motorock_DHL_Express', false ) ) {
			return;
		}

		class WC_Shipping_Motorock_DHL_Express extends WC_Shipping_Method {

			/** @var string */
			public $cost = '';

			/** @var string */
			public $cost_no = '';

			/** @var string */
			public $cost_ch = '';

			public function __construct( $instance_id = 0 ) {
				$this->id                 = 'motorock_dhl_express';
				$this->instance_id        = absint( $instance_id );
				$this->method_title       = 'Motorock DHL Express';
				$this->method_description = 'Express courier: EU (excluding EE, LV, LT), Norway, Switzerland. Fulfillment labels in DHL Express Commerce.';
				$this->supports           = array(
					'shipping-zones',
					'instance-settings',
					'instance-settings-modal',
				);

				$this->init();
			}

			public function init(): void {
				$this->init_form_fields();
				$this->init_settings();

				$this->title      = $this->get_option( 'title', 'DHL Express' );
				$this->tax_status = $this->get_option( 'tax_status', 'taxable' );
				$this->cost       = $this->get_option( 'cost', '' );
				$this->cost_no    = $this->get_option( 'cost_no', '' );
				$this->cost_ch    = $this->get_option( 'cost_ch', '' );

				add_action(
					'woocommerce_update_options_shipping_' . $this->id,
					array( $this, 'process_admin_options' )
				);
			}

			public function init_form_fields(): void {
				$this->instance_form_fields = array(
					'title'      => array(
						'title'       => 'Title',
						'type'        => 'text',
						'description' => 'Shown at checkout.',
						'default'     => 'DHL Express',
						'desc_tip'    => true,
					),
					'tax_status' => array(
						'title'   => 'Tax status',
						'type'    => 'select',
						'class'   => 'wc-enhanced-select',
						'default' => 'taxable',
						'options' => array(
							'taxable' => 'Taxable',
							'none'    => 'None',
						),
					),
					'cost'       => array(
						'title'       => 'Cost',
						'type'        => 'text',
						'placeholder' => '0',
						'description' => 'Default shipping cost (EUR). Applied to all allowed countries unless overridden below.',
						'desc_tip'    => true,
					),
					'cost_no'    => array(
						'title'       => 'Norway (NO) cost',
						'type'        => 'text',
						'placeholder' => 'Same as default',
						'description' => 'Optional override for Norway.',
						'desc_tip'    => true,
					),
					'cost_ch'    => array(
						'title'       => 'Switzerland (CH) cost',
						'type'        => 'text',
						'placeholder' => 'Same as default',
						'description' => 'Optional override for Switzerland.',
						'desc_tip'    => true,
					),
				);
			}

			/**
			 * @param array<string, mixed> $package
			 */
			public function is_available( $package ): bool {
				if ( ! parent::is_available( $package ) ) {
					return false;
				}

				$country = motorock_dhl_express_destination_country( $package );

				if ( $country === '' ) {
					return false;
				}

				return motorock_dhl_express_is_country_allowed( $country );
			}

			/**
			 * @param array<string, mixed> $package
			 */
			public function calculate_shipping( $package = array() ): void {
				$country = motorock_dhl_express_destination_country( $package );
				$cost    = $this->cost;

				if ( $country === 'NO' && $this->cost_no !== '' ) {
					$cost = $this->cost_no;
				} elseif ( $country === 'CH' && $this->cost_ch !== '' ) {
					$cost = $this->cost_ch;
				}

				$this->add_rate(
					array(
						'id'        => $this->get_rate_id(),
						'label'     => $this->title,
						'cost'      => $cost !== '' ? wc_format_decimal( $cost ) : 0,
						'package'   => $package,
						'meta_data' => array(
							'motorock_fulfilment_carrier' => 'dhl_express',
						),
					)
				);
			}
		}
	}
);

add_filter(
	'woocommerce_shipping_methods',
	static function ( array $methods ): array {
		$methods['motorock_dhl_express'] = 'WC_Shipping_Motorock_DHL_Express';

		return $methods;
	}
);

add_action(
	'woocommerce_checkout_create_order',
	static function ( WC_Order $order ): void {
		motorock_dhl_express_stamp_order( $order );
	},
	20,
	1
);

add_action(
	'woocommerce_store_api_checkout_order_processed',
	static function ( WC_Order $order ): void {
		motorock_dhl_express_stamp_order( $order );
	},
	20,
	1
);

add_action(
	'woocommerce_admin_order_data_after_shipping_address',
	static function ( WC_Order $order ): void {
		if ( $order->get_meta( '_motorock_dhl_express' ) !== 'yes' ) {
			return;
		}

		echo '<p class="form-field form-field-wide"><strong>DHL Express fulfillment</strong><br />';
		echo esc_html( 'Create the label in DHL Express Commerce (not Montonio / Shipi).' );
		echo '</p>';
	}
);
