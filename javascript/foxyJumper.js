import * as THREE from '../lib/three.js-master/build/three.module.js';
import {GLTFLoader} from "../lib/three.js-master/examples/jsm/loaders/GLTFLoader.js";

import * as FOX from "./fox.js";
import * as TRAP from "./trap.js";
import * as PLATFORM from "./platform.js";
import {platform} from './platform.js';
import * as UTILS from './utils.js';
import {gameOver} from './index.js';

Physijs.scripts.worker = repository_name + "lib/physijs_worker.js";
Physijs.scripts.ammo = "../ammo.js";


scene = new Physijs.Scene();
texLoader = new THREE.TextureLoader();
const manager = new THREE.LoadingManager();

const center_value = 10;

var trap;
var fox;
var foxInitialPosition = {
    x: 0,
    y: -1,
    z: 0.5,
};
var platformID;

// Camera parameters
const camera = {
    obj: null,

    visible_height: 0,
    visible_width: 0,

    // Initializes the camera and adds it to the scene
    init: function(scene) {
        const z = 20;
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 100;
        this.obj = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.obj.position.set(0, center_value, z);
        this.obj.lookAt(0, center_value, 0);

        this.visible_height = UTILS.visibleHeightAtZDepth(0, this.obj);
        this.visible_width = UTILS.visibleWidthAtZDepth(0, this.obj);

        scene.add(this.obj);
    },

    // Moves the camera up by y points
    up: function(y) {
        const upAnimation = new TWEEN.Tween(this.obj.position)
            .to({y: y}, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }
}

// Lighting
const lights = {
    skyColor: 0xFFFFFF,
    groundColor: 0xFFFFFF,
    ambientLight: null,

    // Initializes the lights
    init: function(scene) {
        this.ambientLight = new THREE.HemisphereLight(this.skyColor, this.groundColor, 0.1);
        scene.add(this.ambientLight);

        const color = 0xFFFFFF;
        const light = new THREE.DirectionalLight(color, 1.0);
        light.position.set(0, 6, 15);
        scene.add(light);
    },
}

// Background
const backgroundAndFog = {
    color: 0x00BFFF,
    // Initializes the background and the fog
    init: function(scene) {
        scene.background = new THREE.Color(this.color);
        scene.fog = new THREE.Fog(scene.background, ground.depth, ground.depth+20);
    },
}

// Ground
const ground = {
    width: 200,
    depth: 60,
    obj: null,
    plane: new THREE.Plane(new THREE.Vector3(0,1,0)),

    // Initializes the ground and adds it to the scene
    init: function(scene) {
        const material = new THREE.MeshBasicMaterial({
            map: Loader.assets.textures.groundMap.data
        });
        material.map.repeat.set(this.width/10, this.depth/10);

        const geometry = new THREE.PlaneBufferGeometry(this.width, this.depth);
        geometry.rotateX(-Math.PI/2);

        this.obj = new THREE.Mesh(geometry, material);

        scene.add(this.obj);
    },
}

const loader = {
    loaded: false,

    assets: {
        textures: {
            wall:             repository_name + "resources/wall.jpg",
            wallNormal:       repository_name + "resources/wall_normal.jpg",

            ground:           repository_name + "resources/ground.jpg",
            groundNormal:     repository_name + "resources/ground_normal.jpg",

            platform1:        repository_name + "resources/platform_grass_block.jpg",
            platform1Roughness:  repository_name + "resources/platform_grass_roughness.jpg",

            platformCr:             repository_name + "resources/crashable_texture.jpg",
            platformCrNormal:   repository_name + "resources/crashable_normal.jpg",
            platformCrRoughness:   repository_name + "resources/crashable_roughness.jpg",
            platformCrMetal:   repository_name + "resources/crashable_metallic.jpg",
            platformCrAlpha:   repository_name + "resources/crashable_alpha.jpg",

            platformJump:             repository_name + "resources/superjump_height.jpg",
            platformJumpNormal:   repository_name + "resources/superjump_normal.jpg",
            platformJumpRoughness:   repository_name + "resources/superjump_roughness.jpg",

            wallLight:                 repository_name + "resources/wall_light.jpg",
            wallLightNormal:           repository_name + "resources/wall_light_normal.jpg",
            wallLightRoughness:        repository_name + "resources/wall_light_roughness.jpg",

            wall1:            repository_name + "resources/scraper_texture_1.jpg",
            wall1Normal:      repository_name + "resources/scraper_normal_1.jpg",
            wall1Roughness:   repository_name + "resources/scraper_roughness_1.jpg",
        },
        objects: {
            foxGltf: repository_name + "resources/simple_fox/scene.gltf",
            trapGltf: repository_name + "resources/trap/scene.gltf",
        },
        sounds: {
            jumpSnd1: repository_name + "resources/sounds/jump1.mp3",
            superJumpSnd: repository_name + "resources/sounds/superJump.mp3",

            vanishSnd: repository_name + "resources/sounds/vanish.mp3",

            trapSnd: repository_name + "resources/sounds/trap_hit.mp3",

            fallSnd1: repository_name + "resources/sounds/fall1.mp3",

            gameOverSnd: repository_name + "resources/sounds/gameOver.mp3",
            gameOpenerSnd: repository_name + "resources/sounds/gameOpener.mp3",
        }
    },

    loadFox: function(scene) {
        document.body.innerHTML = "";
        const text = document.createElement("h");
        text.innerText = "Loading...";
        document.body.appendChild(text);

        var gltfLoader = new GLTFLoader(manager);

        gltfLoader.load(this.assets.objects.foxGltf, (gltf) => {
            fox = gltf.scene;
            fox.name = "fox";
            fox.position.set(foxInitialPosition.x, foxInitialPosition.y, foxInitialPosition.z);
            fox.scale.set(0.05, 0.05, 0.1);

            fox.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            fox.castShadow = true;
            fox.receiveShadow = true;

            // Torso
            root = fox.getObjectByName(FOX.fox_dic.Root);
            hip = fox.getObjectByName(FOX.fox_dic.Hip);
            spine1 = fox.getObjectByName(FOX.fox_dic.Spine1);
            spine2 = fox.getObjectByName(FOX.fox_dic.Spine2);
            neck = fox.getObjectByName(FOX.fox_dic.Neck);
            head = fox.getObjectByName(FOX.fox_dic.Head);

            // Front legs
            rightUpperArm = fox.getObjectByName(FOX.fox_dic.RightUpperArm);
            rightForeArm = fox.getObjectByName(FOX.fox_dic.RightForeArm);
            rightHand = fox.getObjectByName(FOX.fox_dic.RightHand);
            leftUpperArm = fox.getObjectByName(FOX.fox_dic.LeftUpperArm);
            leftForeArm = fox.getObjectByName(FOX.fox_dic.LeftForeArm);
            leftHand = fox.getObjectByName(FOX.fox_dic.LeftHand);

            // Back legs
            leftLeg1 = fox.getObjectByName(FOX.fox_dic.LeftLeg1);
            leftLeg2 = fox.getObjectByName(FOX.fox_dic.LeftLeg2);
            leftFoot1 = fox.getObjectByName(FOX.fox_dic.LeftFoot1);
            leftFoot2 = fox.getObjectByName(FOX.fox_dic.LeftFoot2);
            rightLeg1 = fox.getObjectByName(FOX.fox_dic.RightLeg1);
            rightLeg2 = fox.getObjectByName(FOX.fox_dic.RightLeg2);
            rightFoot1 = fox.getObjectByName(FOX.fox_dic.RightFoot1);
            rightFoot2 = fox.getObjectByName(FOX.fox_dic.RightFoot2);

            // Tail
            tail1 = fox.getObjectByName(FOX.fox_dic.Tail1);
            tail2 = fox.getObjectByName(FOX.fox_dic.Tail2);
            tail3 = fox.getObjectByName(FOX.fox_dic.Tail3);

            // Initial Rotations to adjust the fox
            root.rotation.z = (90 * Math.PI) / 180;
            root.rotation.y = (-3.5 * Math.PI) / 180;

            scene.add(fox);
            FOX.collisionListener(fox);
            FOX.changeBoxPosition(fox);
        },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        );

    },

    // Enemy
    loadTrap: function(scene) {
        var gltfLoader = new GLTFLoader(manager);

        gltfLoader.load(this.assets.objects.trapGltf, (gltf) => {
            trap = gltf.scene;
            trap.name = "trap";
            trap.position.set(20, prevHeight+20, 0);
            trap.scale.set(2, 2, 1);

            trap.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            trap.castShadow = true;
            trap.receiveShadow = true;

            // Torso
            trapRoot = trap.getObjectByName(TRAP.trap_dic.Root);

            scene.add(trap);

            TRAP.collisionListener(trap);
            TRAP.changeBoxPosition(trap);
            TRAP.move(trap);
            TRAP.rotate(trap);
        },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        );

    },

    loadWall: function(scene) {
        var texture;

        // Skyscraper
        if (backgroundChoice == 0){
            texture = texLoader.load( this.assets.textures.wall1, function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 4, 700 );
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.NearestMipmapLinearFilter;

                const geometry = new THREE.PlaneGeometry( 80, 10000 );
                geometry.translate( 0, 0, -2.1);

                var wallMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    normalMap: texLoader.load(loader.assets.textures.wall1Normal),
                    roughnessMap: texLoader.load(loader.assets.textures.wall1Roughness),
                });
                wall = new THREE.Mesh(geometry, wallMaterial, 0);
                scene.add(wall);

           });
        }

        // Bricks wall
        else if(backgroundChoice == 1 ){
            texture = texLoader.load( this.assets.textures.wallLight, function ( texture ) {
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                  texture.offset.set( 0, 0 );
                  texture.repeat.set( 5, 1500 );
                  texture.magFilter = THREE.LinearFilter;
                  texture.minFilter = THREE.NearestMipmapLinearFilter;

                  const geometry = new THREE.PlaneGeometry( 80, 10000 );
                  geometry.translate( 0, 0, -2.1);

                  var wallMaterial = new THREE.MeshStandardMaterial({
                      map: texture,
                      roughnessMap: texLoader.load(loader.assets.textures.wallLightRoughness),
                  });
                  wall = new THREE.Mesh(geometry, wallMaterial, 0);
                  scene.add(wall);

              });
        }
        // Wooden wall
        else if(backgroundChoice == 2 ){
            texture = texLoader.load( this.assets.textures.wall, function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 5, 1500 );
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.NearestMipmapLinearFilter;

                const geometry = new THREE.PlaneGeometry( 80, 10000 );
                geometry.translate( 0, 0, -2.1);

                var wallMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    normalMap: texLoader.load(loader.assets.textures.wallNormal),
                });
                wall = new THREE.Mesh(geometry, wallMaterial, 0);
                scene.add(wall);

            });

        }
        else {
          console.log("No bg selected;")
        }
    },

    loadGround: function(scene) {
        var texture = texLoader.load( this.assets.textures.ground, function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set( 0, 0 );
            texture.repeat.set( 9, 9 );

            const geometry = new THREE.PlaneGeometry( window.innerWidth / 2, window.innerHeight );
            var groundMaterial = new THREE.MeshStandardMaterial({
                map: texture
            });
            var ground = new THREE.Mesh(geometry, groundMaterial, 0);
            ground.rotation.x = (-90 * Math.PI) / 180;

            scene.add(ground);
        } );
    },

    loadPlatform: function(scene) {
        // Load platforms
        //Real platforms
        var texture = texLoader.load(loader.assets.textures.platform1);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        realPlatformMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughnessMap: texLoader.load(loader.assets.textures.platform1Roughness),
          },
            .8,
            .3
        );

        //superJump platform
        var texture = texLoader.load(loader.assets.textures.platformJump);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        woodPlatformMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: texLoader.load(loader.assets.textures.platformJumpNormal),
            roughnessMap: texLoader.load(loader.assets.textures.platformJumpRoughness)
            },
            .8,
            .3
        );

        //Crashable
        var texture = texLoader.load(loader.assets.textures.platformCr);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        crashablePlatformMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: texLoader.load(loader.assets.textures.platformCrNormal),
            roughnessMap: texLoader.load(loader.assets.textures.platformCrRoughness),
            metalnessMap: texLoader.load(loader.assets.textures.platformCrMetal),
            alphaMap: texLoader.load(loader.assets.textures.platformCrAlpha),
            }
        );


        for (platformID = 0; platformID < platforms.number; platformID++) {
            drawPlatform(platformID);
        }
    },

    loadSounds: function(scene){
        jumpSound1 = new Audio(loader.assets.sounds.jumpSnd1);
        jumpSound1.volume = 0.5;

        superJumpSound = new Audio(loader.assets.sounds.superJumpSnd);
        superJumpSound.volume = 0.5;

        vanishSound = new Audio(loader.assets.sounds.vanishSnd);
        vanishSound.volume = 0.5;

        trapSound = new Audio(loader.assets.sounds.trapSnd);
        trapSound.volume = 0.5;

        fallSound1 = new Audio(loader.assets.sounds.fallSnd1);
        fallSound1.volume = 0.5;

        gameOverSound = new Audio(loader.assets.sounds.gameOverSnd);
        gameOverSound.volume = 0.5;

        gameOpenerSound = new Audio(loader.assets.sounds.gameOpenerSnd);
        gameOpenerSound.volume = 0.5;

      },
}

function drawPlatform(platformID) {
    platform.ID = platformID;
    platform.generate(camera.visible_width/4);

    var boxPlatform = PLATFORM.createBoxWithListener(platform);

    platforms[platformID] = platform;
    boxPlatforms[platformID] = boxPlatform;
}

// Handle input events
const inputControls = {
    isRightFacing: true,
    keyboard:true,

    // Initializes the controls listeners
    init: function() {
        this.isRightFacing = true;
        this.keyboard = true;
    },
    keyDown: function (e) {
        if (e.keyCode == '37' && inputControls.keyboard==true) {

            if (inputControls.isRightFacing){
                groupRight.removeAll();
                groupRotating.removeAll();
                FOX.rotateBody(fox, "left");
                inputControls.isRightFacing = false;
            }
            FOX.moveLeft(fox);
        }

        else if (e.keyCode == '39' && inputControls.keyboard==true) {
            if (!inputControls.isRightFacing){
                groupLeft.removeAll();
                groupRotating.removeAll();
                FOX.rotateBody(fox, "right");
                inputControls.isRightFacing = true;
            }
            FOX.moveRight(fox);
         }
    },

    keyUp: function (e) {
        if (e.keyCode == '37' || e.keyCode == '39') {
            groupLeft.removeAll();
            groupRight.removeAll();
        }
    },
}

// Start the game
function start() {
    // Clear web page
    document.body.innerHTML = "";
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", "canvasID");

    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

    scene.setGravity(new THREE.Vector3( 0, 0, 0 ));

    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.gammaOutput = true;

    document.body.appendChild(canvas);

    // keyboard event listeners
    inputControls.init();
    document.onkeydown = inputControls.keyDown;
    document.onkeyup = inputControls.keyUp;

    // Init of the scene
    lights.init(scene);
    backgroundAndFog.init(scene);

    let isFalling = false;
    let i = 0.1;

    // Score and text as sprite on threejs
    score = 0;
    const scoreDiv = document.createElement("div");
    scoreDiv.setAttribute("id", "score");
    document.body.appendChild(scoreDiv);

    const scoreText = document.createElement("h");
    scoreText.setAttribute("id","scoreTxt");

    var animate = function (time) {

        // Resizes the canvas if the window size is changed
        if (resizeRendererToDisplaySize(renderer)) {
            camera.obj.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.obj.updateProjectionMatrix();
        }
        TWEEN.update(time);

        // Update animations
        groupLeft.update();
        groupRight.update();
        groupJumping.update();
        groupRotating.update();
        groupFalling.update();

        // Initial jump
        if(fox.position.y + 1 <= 0){
            if (soundOn)
                gameOpenerSound.play();
            FOX.jump(fox);
        }

        FOX.changeBoxPosition(fox);
        TRAP.changeBoxPosition(trap);

        //difficulty levels
        if (score>=0 && score<=20){
            difficulty = 2;   //easy
            //70% real,10% crashable,20% superjump
            tReal = 70;
            tCrashable = 80;
        }else if (score>20 && score<=40){
            difficulty = 1.5; //medium
            //60% real,20% crashable,20% superjump
            tReal = 60;
            tCrashable = 80;
        }else{
            difficulty = 1.25;  //hard
            //50 %real,40% crashable,10% superjump
            tReal = 50;
            tCrashable = 90;
        }
        if (score % 90 == 0) {
            trap.position.y = fox.position.y + 35;
        }

        // Move camera if the fox pass half of the screen and generate new platform
        let simpleJumpValue = 3;
        if(fox.position.y >= camera.obj.position.y) {
            camera.up(simpleJumpValue + fox.position.y);

            //platforms.pop();
            //boxPlatforms.pop();

            platformID++;
            drawPlatform(platformID);
        }

        //Update score:
        if (fox.position.y > score) {
            score = Math.floor(fox.position.y);
            scoreText.innerText = "SCORE: " + score;
            scoreDiv.appendChild(scoreText);
        }

        // Physijs collisions
        scene.simulate();

        // Game over
        if( Math.abs(fox.position.y - camera.obj.position.y)  >= center_value + 6) {
            prevHeight=0;
            //play game over sound
            if (soundOn)
                gameOverSound.play();

            //remove tweens
            groupJumping.removeAll();
            groupLeft.removeAll();
            groupRight.removeAll();
            groupRotating.removeAll();

            FOX.stopFallAnimation(fox);
            inputControls.keyboard = false;

            //Remove the scene at the end of the game
            while(scene.children.length > 0){
                  scene.remove(scene.children[0]);
            }
            gameOver(score);
            return;
        }

        scene.simulate();
        requestAnimationFrame(animate);
        renderer.render(scene, camera.obj);
    };

    animate();
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    let pixelRatio = 1;

    const width  = canvas.clientWidth  * pixelRatio | 0;
    const height = canvas.clientHeight * pixelRatio | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

// Before starting the game check if the assets have been already loaded
function startGame() {
    if(loader.loaded){
        start();
    } else {
        camera.init(scene);
        loader.loadPlatform(scene);
        loader.loadWall(scene);
        loader.loadGround(scene);
        loader.loadFox(scene);
        loader.loadTrap(scene);
        loader.loadSounds();

        loader.onLoad = start;

        manager.onLoad = function() {
            this.loaded = true;
            loader.onLoad();
        };
    }
}

export{startGame};
