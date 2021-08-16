"use strict";

import * as UTILS from './utils.js';

var number = 10;

const platform = {
    ID: 0,

    width:  6,
    height: 0.5,
    depth:  4,

    position: {
        x: 0,
        y: 0,
        z: 0,
    },

    type: 0,

    generate: function (visible_width) {
        this.position.x = UTILS.generateRandomInt(-visible_width, +visible_width);
        //this.position.y = 6 * this.ID + visible_height/number;  //Same disance among platforms
        this.position.y = prevHeight +  UTILS.generateRandomInt(1,simpleJump/difficulty);
        prevHeight = this.position.y;
    }
}

// COLLISIONS FUNCTIONS
function createBoxWithListener(platform) {
    var rand = UTILS.generateRandomInt(1,100);
    var material;

    var geometry = new THREE.BoxGeometry(6, 0.5, 4);

    if (rand <= tReal) {
        material = Physijs.createMaterial(realPlatformMaterial);
        geometry.name = "real";
    } else if (rand > tReal && rand <= tCrashable) {
        material = Physijs.createMaterial(crashablePlatformMaterial);
        geometry.name = "crashable";
    } else if (rand > tCrashable && rand <= 100) {
        material = Physijs.createMaterial(woodPlatformMaterial);
        geometry.name = "superjump";
    }

    var boxPlatform;
    boxPlatform = new Physijs.BoxMesh(geometry, material, 0);
    boxPlatform.position.set(platform.position.x, platform.position.y, platform.position.z);

    scene.add(boxPlatform);

/*
    boxPlatform.addEventListener("collision", function() {
        console.log("collided, insert here code for BOXXXX");
    });
*/
    return boxPlatform;
}

function changeBoxPosition(boxPlatform) {
    var platBoxPos = boxPlatform.position.clone();
    boxPlatform.position.copy(platBoxPos);
    boxPlatform.rotation.set(0, 0, 0);
    boxPlatform.__dirtyPosition = true;
    boxPlatform.__dirtyRotation = true;

}

export {platform, changeBoxPosition, createBoxWithListener};
