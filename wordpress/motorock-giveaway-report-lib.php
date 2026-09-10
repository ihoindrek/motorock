<?php
/**
 * Shared giveaway 2026 stats — used by WP admin report and CLI audit script.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return array{
 *   id: string,
 *   active_from: string,
 *   active_until: string,
 *   draw_at: string,
 *   min_eligible_subtotal: float,
 *   order_statuses: string[],
 *   exclude_motorcycles: bool
 * }
 */
function motorock_giveaway_campaign_config(): array {
	return array(
		'id'                    => 'giveaway-2026',
		'active_from'           => '2026-01-01 00:00:00',
		'active_until'          => '2026-09-19 23:59:59',
		'draw_at'               => '2026-09-19 23:59:59',
		'min_eligible_subtotal' => 100.0,
		'order_statuses'        => array( 'completed', 'processing' ),
		'exclude_motorcycles'   => true,
	);
}

/**
 * @return int[]
 */
function motorock_giveaway_motorcycle_category_ids(): array {
	static $ids = null;

	if ( is_array( $ids ) ) {
		return $ids;
	}

	$ids = array();
	foreach ( array( 'motorcycles', 'mootorrattad' ) as $slug ) {
		$term = get_term_by( 'slug', $slug, 'product_cat' );
		if ( $term instanceof WP_Term ) {
			$ids[] = (int) $term->term_id;
		}
	}

	return $ids;
}

function motorock_giveaway_product_is_motorcycle( int $product_id, array $motorcycle_cat_ids ): bool {
	if ( $product_id <= 0 || $motorcycle_cat_ids === array() ) {
		return false;
	}

	$terms = wp_get_post_terms( $product_id, 'product_cat', array( 'fields' => 'ids' ) );
	if ( is_wp_error( $terms ) ) {
		return false;
	}

	return (bool) array_intersect( $terms, $motorcycle_cat_ids );
}

/**
 * @param WC_Order $order
 */
function motorock_giveaway_order_equipment_total( WC_Order $order, array $motorcycle_cat_ids, bool $exclude_motorcycles ): float {
	$eligible = 0.0;

	foreach ( $order->get_items() as $item ) {
		if ( ! $item instanceof WC_Order_Item_Product ) {
			continue;
		}

		if ( $exclude_motorcycles ) {
			$product_id   = (int) $item->get_product_id();
			$variation_id = (int) $item->get_variation_id();
			$is_motorcycle = false;

			foreach ( array_filter( array( $variation_id, $product_id ) ) as $check_id ) {
				if ( motorock_giveaway_product_is_motorcycle( $check_id, $motorcycle_cat_ids ) ) {
					$is_motorcycle = true;
					break;
				}
			}

			if ( $is_motorcycle ) {
				continue;
			}
		}

		$eligible += (float) $item->get_total();
	}

	return round( $eligible, 2 );
}

function motorock_giveaway_tickets_for_amount( float $amount, float $min_eligible_subtotal ): int {
	if ( $amount < $min_eligible_subtotal ) {
		return 0;
	}

	return (int) floor( $amount / $min_eligible_subtotal );
}

/**
 * @return array<int, WC_Order>
 */
function motorock_giveaway_fetch_orders( array $config ): array {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return array();
	}

	$after  = strtotime( $config['active_from'] );
	$before = strtotime( $config['active_until'] ) + DAY_IN_SECONDS;

	$orders = wc_get_orders(
		array(
			'limit'        => -1,
			'status'       => $config['order_statuses'],
			'date_created' => $after . '...' . $before,
			'return'       => 'objects',
		)
	);

	return is_array( $orders ) ? $orders : array();
}

/**
 * @return array<string, mixed>
 */
function motorock_giveaway_build_report( ?int $now = null ): array {
	$config             = motorock_giveaway_campaign_config();
	$motorcycle_cat_ids = motorock_giveaway_motorcycle_category_ids();
	$now                = $now ?? time();
	$window_days       = 7;
	$window_start      = $now - ( $window_days * DAY_IN_SECONDS );
	$window_start_date = gmdate( 'Y-m-d', $window_start );
	$prev_window_start = $now - ( 2 * $window_days * DAY_IN_SECONDS );

	$total_tickets      = 0;
	$eligible_orders    = 0;
	$equipment_revenue  = 0.0;
	$participant_roster = array();
	$orders_breakdown   = array();
	$daily_tickets      = array();
	$tickets_last_7     = 0;
	$tickets_prev_7     = 0;
	$orders_last_7      = 0;
	$orders_prev_7      = 0;
	$first_order_by_email = array();

	for ( $i = $window_days - 1; $i >= 0; $i-- ) {
		$day                     = gmdate( 'Y-m-d', $now - ( $i * DAY_IN_SECONDS ) );
		$daily_tickets[ $day ] = 0;
	}

	foreach ( motorock_giveaway_fetch_orders( $config ) as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}

		$eligible = motorock_giveaway_order_equipment_total(
			$order,
			$motorcycle_cat_ids,
			(bool) $config['exclude_motorcycles']
		);

		if ( $eligible < $config['min_eligible_subtotal'] ) {
			continue;
		}

		$tickets    = motorock_giveaway_tickets_for_amount( $eligible, $config['min_eligible_subtotal'] );
		$created    = $order->get_date_created();
		$created_ts = $created ? $created->getTimestamp() : 0;
		$day_key    = $created ? $created->date( 'Y-m-d' ) : '';
		$email      = strtolower( trim( (string) $order->get_billing_email() ) );
		$name       = trim( (string) $order->get_formatted_billing_full_name() );

		$total_tickets     += $tickets;
		$eligible_orders++;
		$equipment_revenue += $eligible;

		if ( $email !== '' ) {
			if ( ! isset( $first_order_by_email[ $email ] ) || $created_ts < $first_order_by_email[ $email ] ) {
				$first_order_by_email[ $email ] = $created_ts;
			}
		}

		$participant_key = $email !== '' ? $email : 'order:' . $order->get_id();
		if ( ! isset( $participant_roster[ $participant_key ] ) ) {
			$participant_roster[ $participant_key ] = array(
				'customer_name' => $name !== '' ? $name : null,
				'email'         => $email !== '' ? $email : null,
				'tickets'       => 0,
				'orders_count'  => 0,
				'order_ids'     => array(),
			);
		}

		if ( $name !== '' && ( empty( $participant_roster[ $participant_key ]['customer_name'] ) || strlen( $name ) > strlen( (string) $participant_roster[ $participant_key ]['customer_name'] ) ) ) {
			$participant_roster[ $participant_key ]['customer_name'] = $name;
		}

		$participant_roster[ $participant_key ]['tickets']      += $tickets;
		$participant_roster[ $participant_key ]['orders_count']++;
		$participant_roster[ $participant_key ]['order_ids'][]   = $order->get_id();

		if ( $created_ts >= $window_start ) {
			$tickets_last_7 += $tickets;
			$orders_last_7++;
			if ( isset( $daily_tickets[ $day_key ] ) ) {
				$daily_tickets[ $day_key ] += $tickets;
			}
		} elseif ( $created_ts >= $prev_window_start ) {
			$tickets_prev_7 += $tickets;
			$orders_prev_7++;
		}

		$orders_breakdown[] = array(
			'order_id'      => $order->get_id(),
			'date'          => $day_key,
			'customer_name' => $name !== '' ? $name : null,
			'email'         => $email !== '' ? $email : null,
			'eligible_eur'  => $eligible,
			'tickets'       => $tickets,
			'status'        => $order->get_status(),
		);
	}

	usort(
		$orders_breakdown,
		static function ( array $a, array $b ): int {
			return $b['tickets'] <=> $a['tickets'] ?: $b['eligible_eur'] <=> $a['eligible_eur'];
		}
	);

	$participants_list = array_values( $participant_roster );
	usort(
		$participants_list,
		static function ( array $a, array $b ): int {
			return $b['tickets'] <=> $a['tickets']
				?: strcmp( (string) ( $a['customer_name'] ?? '' ), (string) ( $b['customer_name'] ?? '' ) );
		}
	);

	$new_participants_last_7 = 0;
	foreach ( $first_order_by_email as $email => $first_ts ) {
		if ( $first_ts >= $window_start ) {
			$new_participants_last_7++;
		}
	}

	$draw_at_ts = strtotime( $config['draw_at'] );
	$days_left  = max( 0, (int) ceil( ( $draw_at_ts - $now ) / DAY_IN_SECONDS ) );

	return array(
		'generated_at'              => gmdate( 'c', $now ),
		'campaign'                    => $config['id'],
		'period'                      => $config['active_from'] . ' .. ' . $config['active_until'],
		'rule'                        => 'floor(equipment_line_total / 100), motorcycles excluded',
		'days_until_draw'           => $days_left,
		'draw_at'                     => $config['draw_at'],
		'total_tickets'               => $total_tickets,
		'unique_participants'         => count( $participants_list ),
		'participants'                => $participants_list,
		'print_tickets'               => motorock_giveaway_build_print_ticket_rows( $participants_list ),
		'eligible_orders'             => $eligible_orders,
		'equipment_revenue_eligible'  => round( $equipment_revenue, 2 ),
		'last_7_days'                 => array(
			'tickets'              => $tickets_last_7,
			'tickets_prev_period'  => $tickets_prev_7,
			'tickets_delta'        => $tickets_last_7 - $tickets_prev_7,
			'eligible_orders'      => $orders_last_7,
			'eligible_orders_prev' => $orders_prev_7,
			'new_participants'     => $new_participants_last_7,
			'daily_tickets'        => $daily_tickets,
		),
		'top_orders'                  => array_slice( $orders_breakdown, 0, 15 ),
		'recent_orders'               => array_slice(
			array_values(
				array_filter(
					$orders_breakdown,
					static function ( array $row ) use ( $window_start_date ): bool {
						return (string) $row['date'] >= $window_start_date;
					}
				)
			),
			0,
			15
		),
	);
}

/**
 * One row per physical ticket — for mail merge / printing.
 *
 * @param array<int, array<string, mixed>> $participants
 * @return array<int, array{customer_name: ?string, email: ?string, ticket_index: int, tickets_total: int}>
 */
function motorock_giveaway_build_print_ticket_rows( array $participants ): array {
	$rows = array();

	foreach ( $participants as $participant ) {
		$tickets_total = (int) ( $participant['tickets'] ?? 0 );
		if ( $tickets_total <= 0 ) {
			continue;
		}

		for ( $index = 1; $index <= $tickets_total; $index++ ) {
			$rows[] = array(
				'customer_name' => $participant['customer_name'] ?? null,
				'email'         => $participant['email'] ?? null,
				'ticket_index'  => $index,
				'tickets_total' => $tickets_total,
			);
		}
	}

	return $rows;
}

/**
 * @param array<int, array<string, mixed>> $rows
 */
function motorock_giveaway_rows_to_csv( array $rows ): string {
	if ( $rows === array() ) {
		return '';
	}

	$handle = fopen( 'php://temp', 'r+' );
	if ( ! is_resource( $handle ) ) {
		return '';
	}

	$headers = array_keys( $rows[0] );
	fputcsv( $handle, $headers );

	foreach ( $rows as $row ) {
		$line = array();
		foreach ( $headers as $header ) {
			$value = $row[ $header ] ?? '';
			if ( is_array( $value ) ) {
				$value = implode( ',', array_map( 'strval', $value ) );
			}
			$line[] = $value;
		}
		fputcsv( $handle, $line );
	}

	rewind( $handle );
	$csv = stream_get_contents( $handle );
	fclose( $handle );

	return is_string( $csv ) ? $csv : '';
}
