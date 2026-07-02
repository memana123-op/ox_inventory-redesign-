return {
	['testburger'] = {
		label = 'Test Burger',
		weight = 220,
		degrade = 60,
		client = {
			image = 'burger_chicken.png',
			status = { hunger = 200000 },
			anim = 'eating',
			prop = 'burger',
			usetime = 2500,
			export = 'ox_inventory_examples.testburger'
		},
		server = {
			export = 'ox_inventory_examples.testburger',
			test = 'what an amazingly delicious burger, amirite?'
		},
		buttons = {
			{
				label = 'Lick it',
				action = function(slot)
					print('You licked the burger')
				end
			},
			{
				label = 'Squeeze it',
				action = function(slot)
					print('You squeezed the burger :(')
				end
			},
			{
				label = 'What do you call a vegan burger?',
				group = 'Hamburger Puns',
				action = function(slot)
					print('A misteak.')
				end
			},
			{
				label = 'What do frogs like to eat with their hamburgers?',
				group = 'Hamburger Puns',
				action = function(slot)
					print('French flies.')
				end
			},
			{
				label = 'Why were the burger and fries running?',
				group = 'Hamburger Puns',
				action = function(slot)
					print('Because they\'re fast food.')
				end
			}
		},
		consume = 0.3
	},

	['bandage'] = {
		label = 'Bandage',
		weight = 115,
		client = {
			anim = { dict = 'missheistdockssetup1clipboard@idle_a', clip = 'idle_a', flag = 49 },
			prop = { model = `prop_rolled_sock_02`, pos = vec3(-0.14, -0.14, -0.08), rot = vec3(-50.0, -50.0, 0.0) },
			disable = { move = true, car = true, combat = true },
			usetime = 2500,
		}
	},

	['black_money'] = {
		label = 'Dirty Money',
	},

	['burger'] = {
		label = 'Burger',
		weight = 220,
		client = {
			status = { hunger = 200000 },
			anim = 'eating',
			prop = 'burger',
			usetime = 2500,
			notification = 'You ate a delicious burger'
		},
	},

	['sprunk'] = {
		label = 'Sprunk',
		weight = 350,
		client = {
			status = { thirst = 200000 },
			anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' },
			prop = { model = `prop_ld_can_01`, pos = vec3(0.01, 0.01, 0.06), rot = vec3(5.0, 5.0, -180.5) },
			usetime = 2500,
			notification = 'You quenched your thirst with a sprunk'
		}
	},

	['parachute'] = {
		label = 'Parachute',
		weight = 8000,
		stack = false,
		client = {
			anim = { dict = 'clothingshirt', clip = 'try_shirt_positive_d' },
			usetime = 1500
		}
	},

	['garbage'] = {
		label = 'Garbage',
	},

	['paperbag'] = {
		label = 'Paper Bag',
		weight = 1,
		stack = false,
		close = false,
		consume = 0
	},

	['identification'] = {
		label = 'Identification',
		client = {
			image = 'card_id.png'
		}
	},

	['panties'] = {
		label = 'Knickers',
		weight = 10,
		consume = 0,
		client = {
			status = { thirst = -100000, stress = -25000 },
			anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' },
			prop = { model = `prop_cs_panties_02`, pos = vec3(0.03, 0.0, 0.02), rot = vec3(0.0, -13.5, -1.5) },
			usetime = 2500,
		}
	},

	['lockpick'] = {
		label = 'Lockpick',
		weight = 160,
	},

	['phone'] = {
		label = 'Phone',
		weight = 190,
		stack = false,
		consume = 0,
		client = {
			add = function(total)
				if total > 0 then
					pcall(function() return exports.npwd:setPhoneDisabled(false) end)
				end
			end,

			remove = function(total)
				if total < 1 then
					pcall(function() return exports.npwd:setPhoneDisabled(true) end)
				end
			end
		}
	},

	['money'] = {
		label = 'Money',
	},

	['mustard'] = {
		label = 'Mustard',
		weight = 500,
		client = {
			status = { hunger = 25000, thirst = 25000 },
			anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' },
			prop = { model = `prop_food_mustard`, pos = vec3(0.01, 0.0, -0.07), rot = vec3(1.0, 1.0, -1.5) },
			usetime = 2500,
			notification = 'You.. drank mustard'
		}
	},

	['water'] = {
		label = 'Water',
		weight = 500,
		client = {
			status = { thirst = 200000 },
			anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' },
			prop = { model = `prop_ld_flow_bottle`, pos = vec3(0.03, 0.03, 0.02), rot = vec3(0.0, 0.0, -1.5) },
			usetime = 2500,
			cancel = true,
			notification = 'You drank some refreshing water'
		}
	},

	['radio'] = {
		label = 'Radio',
		weight = 1000,
		stack = false,
		allowArmed = true
	},

	['armour'] = {
		label = 'Bulletproof Vest',
		weight = 3000,
		stack = false,
		client = {
			anim = { dict = 'clothingshirt', clip = 'try_shirt_positive_d' },
			usetime = 3500
		}
	},

	['clothing'] = {
		label = 'Clothing',
		consume = 0,
	},

	['mastercard'] = {
		label = 'Fleeca Card',
		stack = false,
		weight = 10,
		client = {
			image = 'card_bank.png'
		}
	},

	['scrapmetal'] = {
		label = 'Scrap Metal',
		weight = 80,
	},

	-- Test items for the equipment/clothing slot system.
	-- Their ped visuals are defined in data/custom.lua -> clothing.items
	['test_mask'] = {
		label = 'Test Mask',
		weight = 200,
		stack = false,
	},

	['test_cap'] = {
		label = 'Test Cap',
		weight = 150,
		stack = false,
	},

	['test_glasses'] = {
		label = 'Test Glasses',
		weight = 100,
		stack = false,
	},

	['casino_tablet'] = {
		label = 'Casino Tablet',
		weight = 1000,
		stack = false,
		close = true,
		description = 'A sleek tablet for accessing the casino from anywhere.',
		client = {
			image = 'casino_tablet.png',
		},
		server = {
			export = 'qbx_casino.UseCasinoTablet',
		},
	},

	-- ===== royal_flipper items =====
	['flipperzero'] = {
		label = 'Flipper Zero',
		weight = 300,
		stack = false,
		close = true,
		consume = 0, -- reusable device: never consumed on use
		description = 'A portable multi-tool for hacking and signal analysis.',
		client = {
			image = 'flipperzero.png',
		},
		server = {
			export = 'royal_flipper.UseFlipperZero',
		},
	},

	['blank_police_id'] = {
		label = 'Blank Police ID',
		weight = 15,
		stack = true,
		description = 'A blank ID card suitable for forgery.',
		client = { image = 'blank_police_id.png' },
	},

	['fake_police_id'] = {
		label = 'Fake Police ID',
		weight = 15,
		stack = false,
		description = 'A forged police identification card.',
		client = { image = 'fake_police_id.png' },
	},

	['signal_booster'] = {
		label = 'Signal Booster',
		weight = 80,
		stack = true,
		description = 'Portable signal amplifier for long-range device communication.',
		client = { image = 'signal_booster.png' },
	},

	['hacking_cable'] = {
		label = 'Hacking Cable',
		weight = 40,
		stack = true,
		description = 'Specialized data cable for hardware hacking.',
		client = { image = 'hacking_cable.png' },
	},

	['electronic_parts'] = {
		label = 'Electronic Parts',
		weight = 60,
		stack = true,
		description = 'Generic electronic components for device modifications.',
		client = { image = 'electronic_parts.png' },
	},

	['tracking_beacon'] = {
		label = 'Tracking Beacon',
		weight = 20,
		stack = true,
		description = 'Small GPS beacon for tracking vehicles.',
		client = { image = 'tracking_beacon.png' },
	},

	['rfid_module'] = {
		label = 'RFID Lite Module',
		weight = 45,
		stack = true,
		description = 'Low-power RFID accessory for close-range reader handshakes.',
		client = { image = 'rfid_module.png' },
	},

	['ir_blaster'] = {
		label = 'IR Blaster',
		weight = 55,
		stack = true,
		description = 'Infrared transmitter for short RP pulses against receivers and cameras.',
		client = { image = 'ir_blaster.png' },
	},

	['gpio_probe'] = {
		label = 'GPIO Probe',
		weight = 65,
		stack = true,
		description = 'Probe leads for mapping simple low-voltage utility panels.',
		client = { image = 'gpio_probe.png' },
	},

	['flipper_battery'] = {
		label = 'Flipper Battery Pack',
		weight = 90,
		stack = true,
		close = true,
		consume = 1,
		description = 'Disposable battery pack that restores Royal Flip device power.',
		client = { image = 'flipper_battery.png' },
		server = {
			export = 'royal_flipper.UseFlipperBattery',
		},
	},

	['cooling_pad'] = {
		label = 'Cooling Pad',
		weight = 75,
		stack = true,
		close = true,
		consume = 1,
		description = 'Thermal pad that drops Royal Flip heat after repeated use.',
		client = { image = 'cooling_pad.png' },
		server = {
			export = 'royal_flipper.UseCoolingPad',
		},
	},

	['signal_detector'] = {
		label = 'Signal Detector',
		weight = 180,
		stack = false,
		close = true,
		consume = 0,
		description = 'Law-enforcement field scanner for nearby digital evidence and jammers.',
		client = { image = 'signal_detector.png' },
		server = {
			export = 'royal_flipper.UseSignalDetector',
		},
	},

	['forensic_reader'] = {
		label = 'Forensic Reader',
		weight = 220,
		stack = false,
		close = true,
		consume = 0,
		description = 'Law-enforcement reader for Royal Flip device audit logs.',
		client = { image = 'forensic_reader.png' },
		server = {
			export = 'royal_flipper.UseForensicReader',
		},
	},
}
