/**
* Flocking AI plugin
*
* @module Kiwi
* @submodule Plugins
* @namespace Kiwi.Plugins
* @class FlockingAi
*/
Kiwi.Plugins.FlockingAi =
{
	name: "FlockingAi",
	version: "1.0.0",

	minimumKiwiVersion:"1.1.1",

	pluginDependencies: [ {
		name: "AiTree",
		minimumVersion: "1.0.0"
	} ]
};
Kiwi.PluginManager.register( Kiwi.Plugins.FlockingAi );


Kiwi.Plugins.FlockingAi.Actions = {};
Kiwi.Plugins.FlockingAi.Checks = {};


//////////
// ACTIONS
//////////



/**
* Action Outer Node. Causes the entity to thrust forwards.
* @class Accelerate
* @constructor
* @param params {object} Param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} Game object to which this is attached
* @param [params.acceleration=2] {number} Total thrust acceleration
*/
Kiwi.Plugins.FlockingAi.Actions.Accelerate = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.acceleration = params.acceleration || 2;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.Accelerate,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.Accelerate.prototype.DEFAULT_NODE_NAME =
	"Accelerate Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.Accelerate.prototype._run = function() {
	this.entity.physics.acceleration.x = this.acceleration *
		Math.cos( this.entity.rotation);
	this.entity.physics.acceleration.y = this.acceleration *
		Math.sin( this.entity.rotation);

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to stop thrusting.
* @class Decelerate
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Actions.Decelerate = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.Decelerate,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.Decelerate.prototype.DEFAULT_NODE_NAME =
	"Decelerate Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.Decelerate.prototype._run = function() {
	this.entity.physics.acceleration.x = 0;
	this.entity.physics.acceleration.y = 0;

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to feed from a resource.
* @class Feed
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with food properties
* @param params.resources {Kiwi.Group} A group of entities which
*	count as resources
*/
Kiwi.Plugins.FlockingAi.Actions.Feed = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.resources = params.resources;
	this.feedDist = params.feedDist || 64;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.Feed,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.Feed.
		prototype.DEFAULT_NODE_NAME =
	"Feed Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.Feed.prototype._run =
		function() {
	var i, dist, minDist, resource;

	// Empty resources can never be filled.
	if ( this.resources.members.length === 0 ) {
		return;
	}

	minDist = Math.sqrt(
		Math.pow( this.entity.x - this.resources.members[ 0 ].x, 2 ) +
		Math.pow( this.entity.y - this.resources.members[ 0 ].y, 2 )
		);

	for ( i = 1; i < this.resources.members.length; i++ ) {
		resource = this.resources.members[ i ];
		dist = Math.sqrt(
			Math.pow( this.entity.x - resource.x, 2 ) +
			Math.pow( this.entity.y - resource.y, 2 )
			);
		if ( dist < minDist ) {
			minDist = dist;
		}
	}

	if ( minDist <= this.feedDist ) {
		this.entity.food += this.entity.foodAbsorbRate;

		if ( this.entity.food > this.entity.foodMax ) {
			this.entity.food = this.entity.foodMax;
			this.entity.foodSatiated = true;
			this.entity.foodBecameSatiated = true;
			this.entity.foodHungry = false;
			this.entity.foodBecameHungry = false;
		}
	}

	// Succeed, whether feeding occurred or not.
	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to become hungry.
* @class IncreaseHunger
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Actions.IncreaseHunger = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.IncreaseHunger,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.IncreaseHunger.prototype.DEFAULT_NODE_NAME =
	"Increase Hunger Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.IncreaseHunger.prototype._run = function() {
	var time = this.entity.state.game.time.rate;

	if ( this.entity.food > 0 ) {
		this.entity.food -= this.entity.foodLoseRate * time;
	}

	if ( this.entity.food <= 0 && !this.entity.foodHungry ) {
		this.entity.foodHungry = true;
		this.entity.foodBecameHungry = true;
		this.entity.foodSatiated = false;
		this.entity.foodBecameSatiated = false;
		this.entity.food = 0;
	}

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to ignore proximity for a time.
* @class StartIgnoringProximity
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Actions.StartIgnoringProximity = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.StartIgnoringProximity,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.StartIgnoringProximity.
		prototype.DEFAULT_NODE_NAME =
	"Decelerate Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.StartIgnoringProximity.prototype._run =
		function() {
	this.entity.ignoreProximity = this.entity.ignoreProximityMax;

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to target a distant flier.
* @class TargetFurthestFlier
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with the property `target`.
* @param params.fliers {Kiwi.Group} A group of entities which
*	count as fliers.
*/
Kiwi.Plugins.FlockingAi.Actions.TargetFurthestFlier = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.fliers = params.fliers;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.TargetFurthestFlier,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.TargetFurthestFlier.
		prototype.DEFAULT_NODE_NAME =
	"Target Nearest Flier Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.TargetFurthestFlier.prototype._run =
		function() {
	var i, dist, maxDist, furthestFlier, flier;

	// Empty fliers can never be filled.
	if ( this.fliers.members.length === 0 ) {
		this.status = this.STATUS_FAILURE;
		return;
	}

	maxDist = Math.sqrt(
		Math.pow( this.entity.x - this.fliers.members[ 0 ].x, 2 ) +
		Math.pow( this.entity.y - this.fliers.members[ 0 ].y, 2 )
		);
	furthestFlier = 0;

	for ( i = 1; i < this.fliers.members.length; i++ ) {
		flier = this.fliers.members[ i ];
		if ( flier !== this ) {
			dist = Math.sqrt(
				Math.pow( this.entity.x - flier.x, 2 ) +
				Math.pow( this.entity.y - flier.y, 2 )
				);
			if ( dist > maxDist ) {
				maxDist = dist;
		}
		furthestFlier = i;
		}
	}

	this.entity.setTarget(
		this.fliers.members[ furthestFlier ].x,
		this.fliers.members[ furthestFlier ].y
		);

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to target a distant resource.
* @class TargetFurthestResource
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with the property `target`.
* @param params.resources {Kiwi.Group} A group of entities which
*	count as resources.
*/
Kiwi.Plugins.FlockingAi.Actions.TargetFurthestResource = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.resources = params.resources;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.TargetFurthestResource,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.TargetFurthestResource.
		prototype.DEFAULT_NODE_NAME =
	"Target Furthest Resource Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.TargetFurthestResource.prototype._run =
		function() {
	var i, dist, maxDist, nearestResource, resource;

	// Empty resources can never be filled.
	if ( this.resources.members.length === 0 ) {
		this.status = this.STATUS_FAILURE;
		return;
	}

	maxDist = Math.sqrt(
		Math.pow( this.entity.x - this.resources.members[ 0 ].x, 2 ) +
		Math.pow( this.entity.y - this.resources.members[ 0 ].y, 2 )
		);
	nearestResource = 0;

	for ( i = 1; i < this.resources.members.length; i++ ) {
		resource = this.resources.members[ i ];
		dist = Math.sqrt(
			Math.pow( this.entity.x - resource.x, 2 ) +
			Math.pow( this.entity.y - resource.y, 2 )
			);
		if ( dist > maxDist ) {
			maxDist = dist;
			nearestResource = i;
		}
	}

	this.entity.setTarget(
		this.resources.members[ nearestResource ].x,
		this.resources.members[ nearestResource ].y
		);

	this.status = this.STATUS_SUCCESS;
};

/**
* Action Outer Node. Causes the entity to target a flier.
* @class TargetNearestFlier
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with the property `target`
* @param params.fliers {Kiwi.Group} A group of entities which
*	count as fliers.
*/
Kiwi.Plugins.FlockingAi.Actions.TargetNearestFlier = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.fliers = params.fliers;
	this.margin = params.margin || 0;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.TargetNearestFlier,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.TargetNearestFlier.
		prototype.DEFAULT_NODE_NAME =
	"Target Nearest Flier Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.TargetNearestFlier.prototype._run =
		function() {
	var i, dist, minDist, nearestFlier, flier;

	// Empty fliers can never be filled.
	if ( this.fliers.members.length === 0 ) {
		this.status = this.STATUS_FAILURE;
		return;
	}

	minDist = null;
	nearestFlier = null;

	for ( i = 0; i < this.fliers.members.length; i++ ) {
		flier = this.fliers.members[ i ];
		if ( flier !== this ) {
			dist = Math.sqrt(
				Math.pow( this.entity.x - flier.x, 2 ) +
				Math.pow( this.entity.y - flier.y, 2 )
				);
			if ( dist > this.margin ) {
				if ( dist < minDist || minDist === null ) {
					minDist = dist;
					nearestFlier = i;
				}
			}
		}
	}

	if ( nearestFlier !== null ) {
		this.entity.setTarget(
			this.fliers.members[ nearestFlier ].x,
			this.fliers.members[ nearestFlier ].y
		);
	} else {
		this.entity.setTarget( 0, 0 );
	}

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to target the nearest resource.
* @class TargetNearestResource
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with the property `target`.
* @param params.resources {Kiwi.Group} A group of entities which
*	count as resources.
*/
Kiwi.Plugins.FlockingAi.Actions.TargetNearestResource = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.resources = params.resources;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.TargetNearestResource,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.TargetNearestResource.
		prototype.DEFAULT_NODE_NAME =
	"Target Nearest Resource Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.TargetNearestResource.prototype._run =
		function() {
	var i, dist, minDist, nearestResource, resource;

	// Empty resources can never be filled.
	if ( this.resources.members.length === 0 ) {
		this.status = this.STATUS_FAILURE;
		return;
	}

	minDist = Math.sqrt(
		Math.pow( this.entity.x - this.resources.members[ 0 ].x, 2 ) +
		Math.pow( this.entity.y - this.resources.members[ 0 ].y, 2 )
		);
	nearestResource = 0;

	for ( i = 1; i < this.resources.members.length; i++ ) {
		resource = this.resources.members[ i ];
		dist = Math.sqrt(
			Math.pow( this.entity.x - resource.x, 2 ) +
			Math.pow( this.entity.y - resource.y, 2 )
			);
		if ( dist < minDist ) {
			minDist = dist;
			nearestResource = i;
		}
	}

	this.entity.setTarget(
		this.resources.members[ nearestResource ].x,
		this.resources.members[ nearestResource ].y
		);

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to target a random nearby location.
* @class TargetRandom
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with the property `target`.
*/
Kiwi.Plugins.FlockingAi.Actions.TargetRandom = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.displace = params.displace || 32;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.TargetRandom,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.TargetRandom.prototype.DEFAULT_NODE_NAME =
	"Target Random Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.TargetRandom.prototype._run = function() {
	var ang, x, y;

	ang = Math.pow( ( Math.random() - 0.5 ) * 2, 2 ) * Math.PI * 2 + Math.PI;
	x = this.displace * Math.cos( ang ) + this.entity.x;
	y = this.displace * Math.sin( ang ) + this.entity.y;

	this.entity.setTarget( x, y );

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to target a nearby, rearward flier.
* @class TargetRearFlier
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} A GameObject with the property `target`.
* @param params.fliers {Kiwi.Group} A group of entities which
*	count as fliers.
*/
Kiwi.Plugins.FlockingAi.Actions.TargetRearFlier = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.fliers = params.fliers;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.TargetRearFlier,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.TargetRearFlier.
		prototype.DEFAULT_NODE_NAME =
	"Target Nearest Flier Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.TargetRearFlier.prototype._run =
		function() {
	var angTo, angBetween, dist, flier, i, minDist, nearestFlier;

	// Empty fliers can never be filled.
	if ( this.fliers.members.length === 0 ) {
		this.status = this.STATUS_FAILURE;
		return;
	}

	minDist = null;
	nearestFlier = null;

	for ( i = 1; i < this.fliers.members.length; i++ ) {
		flier = this.fliers.members[ i ];
		dist = Math.sqrt(
			Math.pow( this.entity.x - flier.x, 2 ) +
			Math.pow( this.entity.y - flier.y, 2 )
			);
		if ( dist < minDist || minDist === null ) {
			angTo = Math.atan2( flier.y - this.entity.y,
				flier.x - this.entity.x );
			angBetween = Kiwi.Utils.GameMath.nearestAngleBetween(
				this.entity.rotation, angTo );
			if ( angBetween > Math.PI / 2 ) {
				minDist = dist;
				nearestFlier = i;
			}
		}
	}

	if ( nearestFlier === null ) {
		this.status = this.STATUS_FAILURE;
		return;
	}

	this.entity.setTarget(
		this.fliers.members[ nearestFlier ].x,
		this.fliers.members[ nearestFlier ].y
		);

	this.status = this.STATUS_SUCCESS;
};



/**
* Action Outer Node. Causes the entity to turn.
* Negative values turn left/anticlockwise.
* Positive values turn right/clockwise.
* @class Turn
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
* @param [params.acceleration=0.2] {number} Angular acceleration per frame
*/
Kiwi.Plugins.FlockingAi.Actions.Turn = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.acceleration = params.acceleration || 0.2;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Actions.Turn,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Actions.Turn.prototype.DEFAULT_NODE_NAME =
	"Turn Action outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Actions.Turn.prototype._run = function() {
	this.entity.physics.angularAcceleration = this.acceleration;

	this.status = this.STATUS_SUCCESS;
};





//////////
// CHECKS
//////////


/**
* Check Outer Node. Checks whether the entity is near its target.
* @class AtTarget
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
* @param [params.margin=16] {number} Distance within which to come to target
*/
Kiwi.Plugins.FlockingAi.Checks.AtTarget = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.margin = params.margin || 16;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.AtTarget,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.AtTarget.prototype.DEFAULT_NODE_NAME =
	"At Target Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.AtTarget.prototype._run = function() {
	var dist;

	dist = Math.sqrt(
		Math.pow( this.entity.x - this.entity.target.x, 2 ) +
		Math.pow( this.entity.y - this.entity.target.y, 2 )
		);
	if ( dist < this.margin ) {
		this.status = this.STATUS_SUCCESS;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity has become hungry.
* @class BecameHungry
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.BecameHungry = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.BecameHungry,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.BecameHungry.prototype.DEFAULT_NODE_NAME =
	"Has Become Hungry Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.BecameHungry.prototype._run = function() {
	if ( this.entity.foodBecameHungry ) {
		this.status = this.STATUS_SUCCESS;
		this.entity.foodBecameHungry = false;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity has become satiated.
* @class BecameSatiated
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.BecameSatiated = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.BecameSatiated,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.BecameSatiated.prototype.DEFAULT_NODE_NAME =
	"Has Become Satiated Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.BecameSatiated.prototype._run = function() {
	if ( this.entity.foodBecameSatiated ) {
		this.status = this.STATUS_SUCCESS;
		this.entity.foodBecameSatiated = false;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity is currently hungry.
* @class Hungry
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.Hungry = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.Hungry,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.Hungry.prototype.DEFAULT_NODE_NAME =
	"Is Hungry Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.Hungry.prototype._run = function() {
	if ( this.entity.foodHungry ) {
		this.status = this.STATUS_SUCCESS;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity is ignoring proximity alerts.
* @class IgnoringProximity
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.IgnoringProximity = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.IgnoringProximity,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.IgnoringProximity.prototype.DEFAULT_NODE_NAME =
	"Is Ignoring Proximity Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.IgnoringProximity.prototype._run = function() {
	if ( this.entity.ignoreProximity > 0 ) {
		this.status = this.STATUS_SUCCESS;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity is about to hit an obstacle.
* @class ProximityCheck
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
* @param [params.margin=16] {number} Distance within which to come to obstacle
* @param params.fliers {Kiwi.Group} Group of fliers
* @param params.resources {Kiwi.Group} Group of resources
*/
Kiwi.Plugins.FlockingAi.Checks.ProximityCheck = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.resources = params.resources;
	this.fliers = params.fliers;
	this.margin = params.margin || 16;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.ProximityCheck,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.ProximityCheck.prototype.DEFAULT_NODE_NAME =
	"Proximity Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.ProximityCheck.prototype._run = function() {
	var dist, i, obstacles;

	obstacles = this.resources.members.concat( this.fliers.members );

	for ( i = 0; i < obstacles.length; i++ ) {

		// Do not collide with yourself
		if ( obstacles[ i ] !== this.entity ) {
			dist = Math.sqrt(
				Math.pow( this.entity.x - obstacles[ i ].x, 2 ) +
				Math.pow( this.entity.y - obstacles[ i ].y, 2 )
				);
			if ( dist < this.margin ) {
				this.status = this.STATUS_SUCCESS;
				return;
			}
		}
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity is ahead.
* @class TargetAhead
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
* @param [params.maxAngle=Math.PI/2] {number} Angle within which an object
*	counts as "ahead"
*/
Kiwi.Plugins.FlockingAi.Checks.TargetAhead = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
	this.maxAngle = params.maxAngle || Math.PI / 2;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.TargetAhead,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.TargetAhead.prototype.DEFAULT_NODE_NAME =
	"Target Ahead Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.TargetAhead.prototype._run = function() {
	var angTo, angBetween;

	angTo = Math.atan2(
		this.entity.target.y - this.entity.y,
		this.entity.target.x - this.entity.x
		);

	angBetween = Kiwi.Utils.GameMath.nearestAngleBetween(
		this.entity.rotation, angTo );

	if ( Math.abs( angBetween ) < this.maxAngle ) {
		this.status = this.STATUS_SUCCESS;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity is to the left.
* @class TargetToLeft
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.TargetToLeft = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.TargetToLeft,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.TargetToLeft.prototype.DEFAULT_NODE_NAME =
	"Target To Left Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.TargetToLeft.prototype._run = function() {
	var angTo, angBetween;

	angTo = Math.atan2(
		this.entity.target.y - this.entity.y,
		this.entity.target.x - this.entity.x
		);

	angBetween = Kiwi.Utils.GameMath.nearestAngleBetween(
		this.entity.rotation, angTo );

	if ( angBetween < 0 ) {
		this.status = this.STATUS_SUCCESS;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity is to the right.
* @class TargetToRight
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.TargetToRight = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.TargetToRight,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.TargetToRight.prototype.DEFAULT_NODE_NAME =
	"Target To Left Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.TargetToRight.prototype._run = function() {
	var angTo, angBetween;

	angTo = Math.atan2(
		this.entity.target.y - this.entity.y,
		this.entity.target.x - this.entity.x
		);

	angBetween = Kiwi.Utils.GameMath.nearestAngleBetween(
		this.entity.rotation, angTo );

	if ( angBetween > 0 ) {
		this.status = this.STATUS_SUCCESS;
		return;
	}

	this.status = this.STATUS_FAILURE;
};



/**
* Check Outer Node. Checks whether the entity target is valid.
* @class TargetValid
* @constructor
* @param params {object} The param object
* @param [params.name] {string}
* @param params.entity {Kiwi.Entity} The game object to which this is attached
*/
Kiwi.Plugins.FlockingAi.Checks.TargetValid = function( params ) {
	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.entity = params.entity;
};
Kiwi.extend( Kiwi.Plugins.FlockingAi.Checks.TargetValid,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* @property DEFAULT_NODE_NAME
* @type string
* @public
*/
Kiwi.Plugins.FlockingAi.Checks.TargetValid.prototype.DEFAULT_NODE_NAME =
	"Is Target Valid Check outer node";

/**
* @method _run
* @private
*/
Kiwi.Plugins.FlockingAi.Checks.TargetValid.prototype._run = function() {
	if ( this.entity.target ) {
		if ( typeof this.entity.target.x === "number" &&
				typeof this.entity.target.y === "number" ) {
			this.status = this.STATUS_SUCCESS;
			return;
		}
	}

	this.status = this.STATUS_FAILURE;
};
