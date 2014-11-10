/**
* The soldier is an artifically intelligent barrel hunter.
* It patrols a route looking for barrels, and if it sees one, it shoots at it.
*
* The soldier AI follows this tree:
*
* AI Root
* - Action Selector
* -- Shoot Sequencer
* --- Barrel Detector
* --- Shoot Action
* -- Navigation Sequencer
* --- Move To Location
*
* This is a very simple AI tree, but it is already very functional.
* It begins with the "Action Selector".
* This calls its first child "Shoot Sequencer".
* The Shoot Sequencer in turn calls its first child "Barrel Detector".
* If there is a barrel in sight, it will return success;
* the Shoot Sequencer will then move on through its sequence to
* the "Shoot Action". This starts shooting at the barrel.
* Now the Shoot Sequencer has reached the end of its children,
* and has not encountered an error. It returns success.
* The Action Selector sees a success, and returns immediately.
* The AI update is over.
*
* If there is no barrel in sight, Barrel Detector returns failure.
* The Shoot Sequencer immediately fails.
* The Action Selector moves on to its next child, the "Navigation Sequencer".
* The Navigation Sequencer calls a "Move To Location" child.
* The Move To Location child causes the soldier to walk towards a waypoint.
* If it reaches the waypoint, it targets the next waypoint.
* If it does not, it marks the Move To Location node as "running",
* and comes back to it next time the Navigation Sequencer is called.
*
* In short, the soldier walks back and forth. If they see a barrel,
* they shoot it. 
* 
* @class Soldier
* @constructor
* @param state {Kiwi.State}
* @param x {number}
* @param y {number}
* @param waypoints {array} Array of [x,y] waypoints to follow
*/

var Soldier = function( state, x, y, waypoints ){

	Kiwi.GameObjects.Sprite.call(
		this, state, state.textures.soldier, x, y, false );

	this.animation.add( "idle", [ 0 ], 0.1, false );
	this.animation.add( "walk", [ 1, 2, 3, 4, 5, 6 ], 0.1, true) ;
	this.animation.add( "crouch", [ 7 ], 0.1, false );
	this.animation.play( "walk" );

	this.shootTimer = 25;
	this.shootNum = 99;

	this.pos = this.x + 66;

	this.ai = this.createAi( waypoints );
	this.components.add( this.ai );
};
Kiwi.extend( Soldier, Kiwi.GameObjects.Sprite );

Soldier.prototype.createAi = function( waypoints ) {
	var i, waypoint,
		actionSelector = new Kiwi.Plugins.AiTree.Selector( {
			name: "Action Selector"
		} ),
		ai = new Kiwi.Plugins.AiTree.Ai( this ),
		barrelDetector =
			new Kiwi.Plugins.BasicPatrolAi.Conditions.DetectBarrel( {
			sprite: this,
			target: this.state.barrelGroup,
			range: 150
		} ),
		navSequencer = new Kiwi.Plugins.AiTree.Sequencer(
			{ name : "Navigation Sequencer" } ),
		shootAction = new Kiwi.Plugins.BasicPatrolAi.Actions.ShootAction( {
			sprite: this
		} ),
		shootSequencer = new Kiwi.Plugins.AiTree.Sequencer(
			{ name: "Shoot Sequencer" } );

	for ( i = 0; i < waypoints.length; i++ ) {
		waypoint = new Kiwi.Plugins.BasicPatrolAi.Actions.MoveToLocation( {
			target: waypoints[ i ],
			sprite: this
		} );
		navSequencer.addChild( waypoint );
	}

	shootSequencer.addChild( barrelDetector );
	shootSequencer.addChild( shootAction );

	actionSelector.addChild( shootSequencer );
	actionSelector.addChild( navSequencer );

	ai.addChild( actionSelector );

	return ai;
};

Soldier.prototype.turn = function() {
	this.scaleX *= -1;
};

Soldier.prototype.update = function() {
	Kiwi.GameObjects.Sprite.prototype.update.call( this );
	if ( this.scaleX === -1 ) {
		this.pos = this.x + 66;
	} else {
		this.pos = this.x + 84;
	}
};
