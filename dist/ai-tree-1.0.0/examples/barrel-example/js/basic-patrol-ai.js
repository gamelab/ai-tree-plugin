/**
* An AI library that controls barrel-hunting guards.
*
* @module Kiwi
* @submodule Plugins
* @namespace Kiwi.Plugins
*/
Kiwi.Plugins.BasicPatrolAi = {
	name: "BasicPatrolAi",
	version: "1.0.0"
};
Kiwi.PluginManager.register(Kiwi.Plugins.BasicPatrolAi);

/**
* AI nodes that control guard perceptions.
* @module BasicPatrolAi
* @submodule Conditions
*/
Kiwi.Plugins.BasicPatrolAi.Conditions = {};



/**
* Outer AI node. Detects a barrel.
* @class DetectBarrel
* @constructor
* @param params {object} Generic param object
* @param [params.name] {string} Name for the node
* @param sprite {Kiwi.Entity} The entity which is looking for barrels
* @param target {Kiwi.Group} The group which contains barrels
* @param range {number} The range within which barrels are detected
*/
Kiwi.Plugins.BasicPatrolAi.Conditions.DetectBarrel = function( params ) {

	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	this.sprite = params.sprite;
	this.target = params.target;
	this.range = params.range;
	
	return this;
};
Kiwi.extend( Kiwi.Plugins.BasicPatrolAi.Conditions.DetectBarrel,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* Default node name.
* @property DEFAULT_NODE_NAME
* @type {string}
* @public
* @final
*/
Kiwi.Plugins.BasicPatrolAi.Conditions.DetectBarrel.prototype.DEFAULT_NODE_NAME =
	"Detect Barrel Outer Node";

/**
* Node functionality
* @method _run
* @private
*/
Kiwi.Plugins.BasicPatrolAi.Conditions.DetectBarrel.prototype._run = function() {
	var barrel, distance, i;

	for ( i = 0; i < this.target.members.length; i++ ) {
		barrel = this.target.members[ i ];
		if ( barrel.health > 0 ) {
			if ( Math.abs( barrel.y - this.sprite.y ) < 50 ) {
				distance = barrel.x + 37 - this.sprite.pos;

				// Facing right or left
				if ( this.sprite.scaleX === 1) {
					if ( distance > 0 && distance <= this.range ) {
						this.status = this.STATUS_SUCCESS;
						return;
					}
				} else if ( this.sprite.scaleX === -1) {
					if ( distance < 0 && distance >= -this.range ) {
						this.status = this.STATUS_SUCCESS;
						return;
					}
				}
			}
		}
	}

	this.status = this.STATUS_FAILURE;
};



/**
* AI nodes that control guard actions.
* @module BasicPatrolAi
* @submodule Actions
*/
Kiwi.Plugins.BasicPatrolAi.Actions = {};



/**
* Outer AI node. Moves towards a location. Returns STATUS_RUNNING if still
* approaching the target, and STATUS_SUCCESS upon reaching it.
* @class MoveToLocation
* @constructor
* @param params {object} Generic param object
* @param [params.name] {string} Name for the node
* @param [params.target=[0,0]] {array} X, Y coordinates to seek
* @param params.sprite {Kiwi.Entity} The entity which is moving
* @param [params.proximityThreshold=16] {number} How close to the target the
*	entity gets before it counts as "there"
* @param [params.velocity=2] {number} How fast the entity moves
*/
Kiwi.Plugins.BasicPatrolAi.Actions.MoveToLocation = function( params ) {
	this.target = params.target || [ 0, 0 ];
	this.proximityThreshold = params.proximityThreshold || 16;
	this.velocity = params.velocity || 2;
	this.sprite = params.sprite;

	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	return this;
};
Kiwi.extend( Kiwi.Plugins.BasicPatrolAi.Actions.MoveToLocation,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* Node functionality
* @method _run
* @private
*/
Kiwi.Plugins.BasicPatrolAi.Actions.MoveToLocation.prototype._run =
		function() {
	var dx, dy,
		distX = this.target[0] - this.sprite.transform.x,
		distY = this.target[1] - this.sprite.transform.y,
		dist = Math.sqrt( distX * distX + distY * distY );

	if ( this.sprite.animation.currentAnimation.name !== "walk" ) {
		this.sprite.animation.switchTo( "walk", true );
	}

	if ( dist < this.proximityThreshold ) {
		this.status = this.STATUS_SUCCESS;
	} else if ( dist !== 0 ) {
		dx = distX / dist;
		dy = distY / dist;
		this.sprite.transform.x += dx * this.velocity;
		this.sprite.transform.y += dy * this.velocity;

		if ( dx < 0 && this.sprite.scaleX === 1 ) {
			this.sprite.turn();
		} else if ( dx >= 0 && this.sprite.scaleX === -1 ) {
			this.sprite.turn();
		}

		this.status = this.STATUS_RUNNING;
	}
};



/**
* Outer AI node. Crouches and shoots. Returns STATUS_RUNNING if still
* approaching the target, and STATUS_SUCCESS upon reaching it.
* @class MoveToLocation
* @constructor
* @param params {object} Generic param object
* @param [params.name] {string} Name for the node
* @param params.sprite {Kiwi.Entity} The entity which is shooting
*/
Kiwi.Plugins.BasicPatrolAi.Actions.ShootAction = function( params ) {
	this.sprite = params.sprite;

	Kiwi.Plugins.AiTree.OuterNode.call( this, params );

	return this;
};
Kiwi.extend( Kiwi.Plugins.BasicPatrolAi.Actions.ShootAction,
	Kiwi.Plugins.AiTree.OuterNode );

/**
* Node functionality
* @method _run
* @private
*/
Kiwi.Plugins.BasicPatrolAi.Actions.ShootAction.prototype._run = function() {
	if ( this.sprite.animation.currentAnimation.name !== "crouch" ) {
		this.sprite.animation.switchTo( "crouch", true );
	}
	if ( this.sprite.shootNum > this.sprite.shootTimer ) {
		this.sprite.state.shoot( this.sprite );
		this.sprite.shootNum = 0;
	} else {
		this.sprite.shootNum++;
	}
	this.status = this.STATUS_SUCCESS;
};
