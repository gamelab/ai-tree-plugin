/**
* The Flier is a simple AI actor. It roams a landscape seeking food,
* companionship, and personal space.
*
* Flier AI follows a strict set of rules. The approximate tendencies
* are as follows:
* - It becomes hungry over time.
* - If it becomes hungry, it looks for food nearby.
* - If it finds food, it eats.
* - If it becomes satiated, it moves away.
* - If it is not hungry, it flies towards other nearby fliers.
* - If it is too close to a flier or food source, it moves away.
*
* These rules are properly defined by an AI tree. Once everything has been
* broken down for the computer, it's a lot longer. The full tree is very
* complicated, but we've split it up here to make it human-readable.
* This is also the manner in which we construct the tree. A modular
* construction process is easier to modify and check.
*
*
* AI schematic:
*
* taskSequencer (root)
*	hungerWrapper
*	feedingWrapper
*	navigationSequencer
*
* hungerWrapper
*	hungerSequencer
*		increaseHunger
*		checkHunger
*		hungryTargetSelector
*			targetResource
*			targetRandom
*	success
*
* feedingWrapper
*	feedingSequencer
*		isHungry
*		feed
*		checkSatiation
*		targetRandom
*	success
*
* navigationSequencer
*	targetValidationWrapper
*	proximityWrapper
*	targetApproachWrapper
*	flightSequencer
*
* targetValidationWrapper
*	targetValidationSequencer
*		inverter
*			isTargetValid
*		targetRandom
*	success
*
* proximityWrapper
*	isIgnoringProximity
*	proximitySequencer
*		proximityCheck
*		scatterSelector
*			scatterHungrySequencer
*				isHungry
*				targetRandom
*				startIgnoringProximity
*			targetRearSequencer
*				targetRear
*				startIgnoringProximity
*			targetRandomSequencer
*				targetRandom
*				startIgnoringProximity
*	success
*
* targetApproachWrapper
*	targetApproachSequencer
*		atTarget
*		retargetSelector
*			retargetHungrySequencer
*				isHungry
*				targetResource
*			targetNearestFlier
*			targetRandom
*	success
*
* flightSequencer
*	steeringSelector
*		leftSequencer
*			targetToLeft
*			turnLeft
*		rightSequencer
*			targetToRight
*			turnRight
*		success
*	accelerationSelector
*		accelerationSequencer
*			targetAhead
*			accelerate
*		decelerate
*
*
* @class Flier
* @constructor
* @param state {Kiwi.State} The current game state
* @param x {number}
* @param y {number}
*/

var Flier = function( state, x, y ) {
	this.food = Math.random() * 10000;
	this.foodMax = 10000;
	this.foodAbsorbRate = 250;
	this.foodLoseRate = 1;
	this.foodHungry = false;
	this.foodSatiated = false;
	this.foodBecameHungry = false;
	this.foodBecameSatiated = false;

	this.target = null;
	this.ignoreProximity = 0;
	this.ignoreProximityMax = 60;

	Kiwi.Group.call( this, state );

	this.x = x;
	this.y = y;

	this.createGeometry();

	this.rotation = Math.random() * Math.PI * 2;

	this.ai = this.buildAi();
	this.components.add( this.ai );

	this.physics = new Kiwi.Components.ArcadePhysics(
		this, this.members[ 0 ].box );
	this.components.add( this.physics );
	this.physics.maxAngular = 0.2;
	this.physics.angularDrag = this.physics.maxAngular * 0.01;
	this.physics.maxVelocity.x = 50;
	this.physics.maxVelocity.y = 50;
	this.physics.drag.x = this.physics.maxVelocity.x * 0.01;
	this.physics.drag.y = this.physics.maxVelocity.y * 0.01;
};
Kiwi.extend( Flier, Kiwi.Group );




/**
* AI helper. Because the Flier AI is very long, we have broken it up
* into several parts. This is good practice for complex trees. As the AiTree
* plugin deals exclusively in node parent-child connections, we can easily
* handle branch construction elsewhere and simpy return a root node for
* connection.
*
* The AI tree consists of a single Task Sequencer. This runs three branches:
* Hunger Sequencer, Feeding Sequencer, and Navigation Sequencer. The branches
* must run in sequence, so they are constructed to always succeed.
*
* AI schematic:
*
* taskSequencer (root)
*	hungerWrapper
*	feedingWrapper
*	navigationSequencer
*
* @method buildAi
* @return {Kiwi.Plugins.AiTree.Ai} An AI tree
* @public
*/
Flier.prototype.buildAi = function() {
	var ai = new Kiwi.Plugins.AiTree.Ai( this ),
		taskSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Task Sequencer inner node"
		});

	ai.addChild( taskSequencer );
	taskSequencer.addChild( this.buildHungerSequencer() );
	taskSequencer.addChild( this.buildFeedingSequencer() );
	taskSequencer.addChild( this.buildNavigationSequencer() );

	return ai;
};




/**
* AI helper. The Hunger Sequencer controls feeding behaviours.
* The Flier grows hungry over time. If it runs out of food,
* it selects a resource node as its new target. If it cannot
* find a resource node, it selects a random point.
*
* This helper uses a "success wrapper". What happens inside the helper is
* immaterial; it should always report success. To do this, we put the main
* sequencer inside a selector, and follow it with a "success" node. This way,
* even if the main sequencer fails, the selector will find a success to return.
*
* AI schematic:
*
* hungerWrapper
*	hungerSequencer
*		increaseHunger
*		checkHunger
*		hungryTargetSelector
*			targetResource
*			targetRandom
*	success
*
* @method buildHungerSequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildHungerSequencer = function() {
	var checkHunger = new Kiwi.Plugins.FlockingAi.Checks.BecameHungry( {
			entity: this
		}),
		hungerSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Hunger Sequencer inner node"
		}),
		hungerWrapper = new Kiwi.Plugins.AiTree.Selector( {
			name: "Hunger Wrapper inner node"
		}),
		hungryTargetSelector = new Kiwi.Plugins.AiTree.Selector( {
			name: "Hungry Target Selector inner node"
		}),
		increaseHunger =
				new Kiwi.Plugins.FlockingAi.Actions.IncreaseHunger( {
			entity: this
		} ),
		success = new Kiwi.Plugins.AiTree.Success( {} ),
		targetResource =
				new Kiwi.Plugins.FlockingAi.Actions.TargetFurthestResource( {
			entity: this,
			resources: this.state.resourceGroup
		}),
		targetRandom = new Kiwi.Plugins.FlockingAi.Actions.TargetRandom( {
			entity: this
		});

	hungerWrapper.addChild( hungerSequencer );
	hungerSequencer.addChild( increaseHunger );
	hungerSequencer.addChild( checkHunger );
	hungerSequencer.addChild( hungryTargetSelector );
	hungryTargetSelector.addChild( targetResource );
	hungryTargetSelector.addChild( targetRandom );
	hungerWrapper.addChild( success );

	return hungerWrapper;
};




/**
* AI helper. The Feeding Sequencer controls feeding and satiation.
* If the Flier is hungry, it attempts to imbibe food. If this
* triggers satiation, it attempts to fly a considerable distance
* away from the feeding zone.
*
* This helper has two possible break points in the main sequencer.
* If it is not hungry, it will stop immediately.
* If it is hungry, but is not satiated, it will not reach the final
* stage and select a new target.
*
* This helper uses a "success wrapper". What happens inside the helper is
* immaterial; it should always report success. To do this, we put the main
* sequencer inside a selector, and follow it with a "success" node. This way,
* even if the main sequencer fails, the selector will find a success to return.
*
* AI schematic:
*
* feedingWrapper
*	feedingSequencer
*		isHungry
*		feed
*		checkSatiation
*		targetRandom
*	success
*
* @method buildFeedingSequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildFeedingSequencer = function() {
	var checkSatiation =
				new Kiwi.Plugins.FlockingAi.Checks.BecameSatiated( {
			entity: this
		}),
		feed = new Kiwi.Plugins.FlockingAi.Actions.Feed( {
			entity: this,
			resources: this.state.resourceGroup,
			feedDist: 32
		}),
		feedingWrapper = new Kiwi.Plugins.AiTree.Selector( {
			name: "Feeding Wrapper inner node"
		}),
		feedingSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Feeding Sequencer inner node"
		}),
		isHungry = new Kiwi.Plugins.FlockingAi.Checks.Hungry( {
			entity: this
		}),
		success = new Kiwi.Plugins.AiTree.Success( {} ),
		targetRandom = new Kiwi.Plugins.FlockingAi.Actions.TargetRandom( {
			entity: this,
			displace: 256
		});

	feedingWrapper.addChild( feedingSequencer );
	feedingSequencer.addChild( isHungry );
	feedingSequencer.addChild( feed );
	feedingSequencer.addChild( checkSatiation );
	feedingSequencer.addChild( targetRandom );
	feedingWrapper.addChild( success );

	return feedingWrapper;
};




/**
* AI helper. The Navigation Sequencer consists of four sub-sequencers:
* Target Validation, Proximity, Target Approach, and Flight. All four are
* expected to run successfully and in sequence every frame.
*
* AI schematic:
*
* navigationSequencer
*	targetValidationWrapper
*	proximityWrapper
*	targetApproachWrapper
*	flightSequencer
*
* @method buildNavigationSequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildNavigationSequencer = function() {
	var navigationSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Navigation Sequencer inner node"
		});

	navigationSequencer.addChild( this.buildTargetValidationSequencer() );
	navigationSequencer.addChild( this.buildProximitySequencer() );
	navigationSequencer.addChild( this.buildTargetApproachSequencer() );
	navigationSequencer.addChild( this.buildFlightSequencer() );

	return navigationSequencer;
};




/**
* AI helper. The Target Validation Sequencer checks to see whether
* the Flier has a valid target. If not, it supplies a random destination.
* This is useful in case the Flier was not initialised with a target.
*
* This helper uses a "success wrapper". What happens inside the helper is
* immaterial; it should always report success. To do this, we put the main
* sequencer inside a selector, and follow it with a "success" node. This way,
* even if the main sequencer fails, the selector will find a success to return.
*
* AI Schematic
*
* targetValidationWrapper
*	targetValidationSequencer
*		inverter
*			isTargetValid
*		targetRandom
*	success
*
* @method buildTargetValidationSequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildTargetValidationSequencer = function() {
	var inverter = new Kiwi.Plugins.AiTree.Inverter( {} ),
		isTargetValid = new Kiwi.Plugins.FlockingAi.Checks.TargetValid( {
			entity: this
		}),
		success = new Kiwi.Plugins.AiTree.Success( {} ),
		targetRandom = new Kiwi.Plugins.FlockingAi.Actions.TargetRandom( {
			entity: this
		}),
		targetValidationSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Target Validation Sequencer inner node"
		}),
		targetValidationWrapper = new Kiwi.Plugins.AiTree.Selector( {
			name: "Target Validation Wrapper inner node"
		});

	targetValidationWrapper.addChild( targetValidationSequencer );
	targetValidationSequencer.addChild( inverter );
	inverter.addChild( isTargetValid );
	targetValidationSequencer.addChild( targetRandom );
	targetValidationWrapper.addChild( success );

	return targetValidationWrapper;
};




/**
* AI helper. The Proximity Sequencer checks to see whether the Flier is
* about to run into an obstacle, and acts to prevent collisions.
*
* The helper first checks to see whether the Flier is currently
* ignoring obstacles. The Flier will briefly ignore obstacles after
* proximity alerts so as not to be paralysed by repeated alerts.
*
* If it not ignoring alerts, and it encounters an alert, it enacts
* a scatter behaviour. When scattering, if it is hungry,
* it picks a random target. If it is not hungry, it attempts to find
* another flier somewhere close behind it, and if it cannot, it picks
* a random target. Any of the three options also tells the flier to
* start ignoring proximity alerts for a time.
*
* This helper uses a "success wrapper". What happens inside the helper is
* immaterial; it should always report success. To do this, we put the main
* sequencer inside a selector, and follow it with a "success" node. This way,
* even if the main sequencer fails, the selector will find a success to return.
*
* AI schematic:
*
* proximityWrapper
*	isIgnoringProximity
*	proximitySequencer
*		proximityCheck
*		scatterSelector
*			scatterHungrySequencer
*				isHungry
*				targetRandom
*				startIgnoringProximity
*			targetRearSequencer
*				targetRear
*				startIgnoringProximity
*			targetRandomSequencer
*				targetRandom
*				startIgnoringProximity
*	success
*
* @method buildProximitySequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildProximitySequencer = function() {
	var isHungry = new Kiwi.Plugins.FlockingAi.Checks.Hungry( {
			entity: this
		}),
		isIgnoringProximity =
				new Kiwi.Plugins.FlockingAi.Checks.IgnoringProximity( {
			entity: this
		}),
		proximityCheck = new Kiwi.Plugins.FlockingAi.Checks.ProximityCheck( {
			entity: this,
			resources: this.state.resourceGroup,
			fliers: this.state.flierGroup,
			margin: 8
		}),
		proximitySequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Proximity Sequencer inner node"
		}),
		proximityWrapper = new Kiwi.Plugins.AiTree.Selector( {
			name: "Proximity Wrapper inner node"
		}),
		scatterHungrySequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Scatter Hungry Sequencer inner node"
		}),
		scatterSelector = new Kiwi.Plugins.AiTree.Selector( {
			name: "Scatter Selector inner node"
		}),
		startIgnoringProximity =
				new Kiwi.Plugins.FlockingAi.Actions.StartIgnoringProximity( {
			entity: this
		}),
		success = new Kiwi.Plugins.AiTree.Success( {} ),
		targetRear = new Kiwi.Plugins.FlockingAi.Actions.TargetRearFlier( {
			entity: this,
			fliers: this.state.flierGroup
		}),
		targetRearSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Target Rear Sequencer inner node"
		}),
		targetRandom = new Kiwi.Plugins.FlockingAi.Actions.TargetRandom( {
			entity: this
		}),
		targetRandomSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Target Random Sequencer inner node"
		});

	proximityWrapper.addChild( isIgnoringProximity );
	proximityWrapper.addChild( proximitySequencer );
	proximitySequencer.addChild( proximityCheck );
	proximitySequencer.addChild( scatterSelector );
	scatterSelector.addChild( scatterHungrySequencer );
	scatterHungrySequencer.addChild( isHungry );
	scatterHungrySequencer.addChild( targetRandom );
	scatterHungrySequencer.addChild( startIgnoringProximity );
	scatterSelector.addChild( targetRearSequencer );
	targetRearSequencer.addChild( targetRear );
	targetRearSequencer.addChild( startIgnoringProximity );
	scatterSelector.addChild( targetRandomSequencer );
	targetRandomSequencer.addChild( targetRandom );
	targetRandomSequencer.addChild( startIgnoringProximity );
	proximityWrapper.addChild( success );

	return proximityWrapper;
};



/**
* AI helper. The Target Approach Sequencer handles what happens when the flier
* approaches its target. If it is sufficiently close to the target, it
* finds a new target. If it is hungry, the new target is the nearest resource.
* If it is not hungry, it attempts to find a nearby flier; if it cannot, it
* finds a random nearby point.
*
* This helper uses a simple condition sequence. The "retargetHungrySequencer"
* checks "isHungry"; if the Flier is indeed hungry it runs "targetResource".
* This is a helpful structure for performing simple "if-then" checks.
*
* This helper uses a "success wrapper". What happens inside the helper is
* immaterial; it should always report success. To do this, we put the main
* sequencer inside a selector, and follow it with a "success" node. This way,
* even if the main sequencer fails, the selector will find a success to return.
*
* AI schematic:
*
* targetApproachWrapper
*	targetApproachSequencer
*		atTarget
*		retargetSelector
*			retargetHungrySequencer
*				isHungry
*				targetResource
*			targetNearestFlier
*			targetRandom
*	success
*
* @method buildTargetApproachSequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildTargetApproachSequencer = function() {
	var atTarget = new Kiwi.Plugins.FlockingAi.Checks.AtTarget( {
			entity: this
		}),
		isHungry = new Kiwi.Plugins.FlockingAi.Checks.Hungry( {
			entity: this
		} ),
		retargetSelector = new Kiwi.Plugins.AiTree.Selector( {
			name: "Retarget Selector inner node"
		}),
		retargetHungrySequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Retarget Hungry Sequencer inner node"
		}),
		success = new Kiwi.Plugins.AiTree.Success( {} ),
		targetApproachSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Target Approach Sequencer inner node"
		}),
		targetApproachWrapper = new Kiwi.Plugins.AiTree.Selector( {
			name: "Target Approach Wrapper inner node"
		}),
		targetNearestFlier =
				new Kiwi.Plugins.FlockingAi.Actions.TargetNearestFlier( {
			entity: this,
			fliers: this.state.flierGroup,
			margin: 128
		}),
		targetResource =
				new Kiwi.Plugins.FlockingAi.Actions.TargetFurthestResource( {
			entity: this,
			resources: this.state.resourceGroup
		}),
		targetRandom = new Kiwi.Plugins.FlockingAi.Actions.TargetRandom( {
			entity: this
		});

	targetApproachWrapper.addChild( targetApproachSequencer );
	targetApproachSequencer.addChild( atTarget );
	targetApproachSequencer.addChild( retargetSelector );
	retargetSelector.addChild( retargetHungrySequencer );
	retargetHungrySequencer.addChild( isHungry );
	retargetHungrySequencer.addChild( targetResource );
	retargetSelector.addChild( targetNearestFlier );
	retargetSelector.addChild( targetRandom );
	targetApproachWrapper.addChild( success );

	return targetApproachWrapper;
};



/**
* AI helper. The Flight Sequencer decides whether to steer left or right,
* accelerates faster if the target is ahead, and slower if it is behind.
*
* AI schematic:
*
* flightSequencer
*	steeringSelector
*		leftSequencer
*			targetToLeft
*			turnLeft
*		rightSequencer
*			targetToRight
*			turnRight
*		success
*	accelerationSelector
*		accelerationSequencer
*			targetAhead
*			accelerate
*		decelerate
*
* @method buildFlightSequencer
* @return {Kiwi.Plugins.AiTree.OuterNode} An AI tree node
* @public
*/
Flier.prototype.buildFlightSequencer = function() {
	var accelerate = new Kiwi.Plugins.FlockingAi.Actions.Accelerate( {
			entity: this,
			acceleration: 5
		}),
		accelerationSelector = new Kiwi.Plugins.AiTree.Selector( {
			name: "Acceleration Selector"
		}),
		accelerationSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Acceleration Sequencer"
		}),
		decelerate = new Kiwi.Plugins.FlockingAi.Actions.Accelerate( {
			entity: this,
			acceleration: 1
		}),
		flightSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Flight Sequencer inner node"
		}),
		leftSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Left Sequencer inner node"
		}),
		rightSequencer = new Kiwi.Plugins.AiTree.Sequencer( {
			name: "Right Sequencer inner node"
		}),
		success = new Kiwi.Plugins.AiTree.Success( {} ),
		steeringSelector = new Kiwi.Plugins.AiTree.Selector( {
			name: "Steering Selector inner node"
		}),
		targetAhead = new Kiwi.Plugins.FlockingAi.Checks.TargetAhead( {
			entity: this,
			maxAngle: Math.PI / 4
		}),
		targetToLeft = new Kiwi.Plugins.FlockingAi.Checks.TargetToLeft( {
			entity: this
		}),
		targetToRight = new Kiwi.Plugins.FlockingAi.Checks.TargetToRight( {
			entity: this
		}),
		turnLeft = new Kiwi.Plugins.FlockingAi.Actions.Turn( {
			name: "Turn Left outer node",
			entity: this,
			acceleration: -0.2
		}),
		turnRight = new Kiwi.Plugins.FlockingAi.Actions.Turn( {
			name: "Turn Right outer node",
			entity: this,
			acceleration: 0.2
		});

	flightSequencer.addChild( steeringSelector );
	steeringSelector.addChild( leftSequencer );
	leftSequencer.addChild( targetToLeft );
	leftSequencer.addChild( turnLeft );
	steeringSelector.addChild( rightSequencer );
	rightSequencer.addChild( targetToRight );
	rightSequencer.addChild( turnRight );
	steeringSelector.addChild( success );
	flightSequencer.addChild( accelerationSelector );
	accelerationSelector.addChild( accelerationSequencer );
	accelerationSequencer.addChild( targetAhead );
	accelerationSequencer.addChild( accelerate );
	accelerationSelector.addChild( decelerate );

	return flightSequencer;
};


/**
* Construct the geometry of this Flier.
* @method createGeometry
* @public
*/
Flier.prototype.createGeometry = function() {
	var geo, params;

	this.clear();

	params = {
		state: this.state,
		points: [ [ 10, 0 ], [ -3, -3 ], [ -3, 3 ] ]
	};

	geo = new Kiwi.Plugins.Primitives.Triangle( params );

	this.addChild( geo );
	this.body = geo;
};

/**
* Some additional work to smooth out physics.
* @method doCustomPhysics
* @public
*/
Flier.prototype.doCustomPhysics = function() {

	// Some manual drag to help turn corners
	this.physics.velocity.x *= 0.95;
	this.physics.velocity.y *= 0.95;
	this.physics.angularAcceleration *= 0.95;
};

/**
* Set the target to which the flier will fly.
* @method setTarget
* @param x {number}
* @param y {number}
* @public
*/
Flier.prototype.setTarget = function( x, y ) {
	this.target = new Kiwi.Geom.Point( x, y );
};

/**
* Perform per-frame updates on subsystems.
* @method update
* @public
*/
Flier.prototype.update = function() {
	this.ai.update();

	this.physics.update();
	this.doCustomPhysics();

	this.ignoreProximity -= 1;
	if ( this.ignoreProximity < 0 ) {
		this.ignoreProximity = 0;
	}

	this.updateColor();
};

/**
* Sets the color of the geometry.
* The body is yellow when satiated and red when hungry.
* The outline flashes purple when the flier receives a proximity alert.
* @method updateColor
* @public
*/
Flier.prototype.updateColor = function() {
	var proxValue = this.ignoreProximity / this.ignoreProximityMax * 0.5;

	this.body.strokeColor = [
		proxValue * 0.8,
		proxValue * 0.5,
		proxValue
	];

	this.body.color = [
		0.8,
		this.food / this.foodMax,
		0.3
	];
};
