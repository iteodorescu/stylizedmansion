if ( WEBGL.isWebGLAvailable() === false ) {

    document.body.appendChild( WEBGL.getWebGLErrorMessage() );

}



var container, stats;
var camera, scene, renderer, controls;
var house;
var planeMesh;
var renderTarget, cubeMap;
var composer;
var plights = [];
var dlight;

var passes = {}

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 0, 200 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    renderer = new THREE.WebGLRenderer();
    renderer.toneMapping = THREE.LinearToneMapping;

    //

    var geometry = new THREE.TorusKnotBufferGeometry( 18, 8, 150, 20 );
    var material = new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        metalness: params.metalness,
        roughness: params.roughness
    } );


    var geometry = new THREE.PlaneBufferGeometry( 200, 200 );
    var material = new THREE.MeshBasicMaterial();

    planeMesh = new THREE.Mesh( geometry, material );
    planeMesh.position.y = - 50;
    planeMesh.rotation.x = - Math.PI * 0.5;
    scene.add( planeMesh );

    addPointLights()
    addDirLight()

    addObject('house')

    setCubeMap()

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    //renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.gammaInput = true; // ???
    renderer.gammaOutput = true;

    stats = new Stats();
    container.appendChild( stats.dom );

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.minDistance = 50;
    controls.maxDistance = 300;
    controls.maxPolarAngle = 0.9 * Math.PI / 2;
	controls.enableZoom = false;

    window.addEventListener( 'resize', onWindowResize, false );

    guiInit()


    composer = new THREE.EffectComposer(renderer);

    var renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // addCustomShader(toon)


    

}

function addCustomShader(name) {
    var customPass = new THREE.ShaderPass(name);
    composer.addPass(customPass);
    return customPass
}

function addPointLights () {
    var intensity = 10;
    var distance = 150;
    var decay = 2.0;
    var c = 0xffffff
    // var c1 = 0xff0040, c2 = 0x0040ff, c3 = 0x80ff80, c4 = 0xffaa00, c5 = 0x00ffaa, c6 = 0xff1100;
    var sphere = new THREE.SphereBufferGeometry( 0.25, 16, 8 );

    for (let i = 0; i < 6; i++) {
        var light = new THREE.PointLight( c, intensity, distance, decay );
        light.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c } ) ) );
        scene.add( light );
        plights.push(light)
    }
}

function addDirLight() {
    dlight = new THREE.DirectionalLight( 0xffffff, 0.05 );
    dlight.position.set( 0.5, 1, 100 ).normalize();
    scene.add( dlight );
}

function updateDirLight() {
    dlight.intensity = params.directionalLight
}

function updatePointLights() {
    var time = Date.now() * 0.00025;
    var d = 200;
    plights[0].position.x = Math.sin( time * 0.7 ) * d;
    plights[0].position.z = Math.cos( time * 0.3 ) * d;
    plights[1].position.x = Math.cos( time * 0.3 ) * d;
    plights[1].position.z = Math.sin( time * 0.7 ) * d;
    plights[2].position.x = Math.sin( time * 0.7 ) * d;
    plights[2].position.z = Math.sin( time * 0.5 ) * d;
    plights[3].position.x = Math.sin( time * 0.3 ) * d;
    plights[3].position.z = Math.sin( time * 0.5 ) * d;
    plights[4].position.x = Math.cos( time * 0.3 ) * d;
    plights[4].position.z = Math.sin( time * 0.5 ) * d;
    plights[5].position.x = Math.cos( time * 0.7 ) * d;
    plights[5].position.z = Math.cos( time * 0.5 ) * d;
}

function updateVisPointLights() {
    plights.forEach((light) => light.visible = params.pointLights)
}

function addObject (filename) {
    var loader = new THREE.OBJLoader();
    var material = new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        metalness: params.metalness,
        roughness: params.roughness
    } );

    // load a resource
    loader.load(
        // resource URL
        `obj/${filename}.obj`,
        // called when resource is loaded
        function ( object ) {
            if (filename === 'house') {
                object = houseInit(object)
            }
            
            object.material = material
            scene.add( object ); // .setMaterials() for material? see docs

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}


function onWindowResize() { /// not fully implemented

    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();


    renderer.setSize( width, height );

}

function animate() {

    requestAnimationFrame( animate );

    stats.begin();
    render();
    stats.end();

}

function houseInit(object) {
    object.scale.multiplyScalar(25)
    object.position.y = -75
    object.position.z = -150
    object.rotation.y = Math.PI / 2;

    var loader = new THREE.TextureLoader();

    // load a resource
    loader.load(
        // resource URL
        'textures/HOUSE_Material.PNG',

        // onLoad callback
        function ( texture ) {
            // in this example we create the material when the texture is loaded
            texture.format = THREE.RGBFormat;
            var material = new THREE.MeshPhongMaterial( {
                color: 0xffffff,
                map: texture
            } );
            object.traverse( function ( child ) {

                if ( child instanceof THREE.Mesh ) {
        
                    child.material = material;
        
                }
        
            } );
        },

        // onProgress callback currently not supported
        undefined,

        // onError callback
        function ( err ) {
            console.error( 'An error happened.' );
        }
    );

    house = object

    return object
}

function setCubeMap() {
    var urls = [ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ];
    cubeMap = new THREE.CubeTextureLoader()
        .setPath( `./textures/${params.env}/` )
        .load( urls, function () {

            cubeMap.encoding = THREE.GammaEncoding;

            var pmremGenerator = new THREE.PMREMGenerator( cubeMap );
            pmremGenerator.update( renderer );

            var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
            pmremCubeUVPacker.update( renderer );

            renderTarget = pmremCubeUVPacker.CubeUVRenderTarget;

            pmremGenerator.dispose();
            pmremCubeUVPacker.dispose();

    } );
}

function render() {

    if (house) {


        var newEnvMap = renderTarget ? renderTarget.texture : null;

        if ( newEnvMap && newEnvMap !== house.material.envMap ) {

            house.material.envMap = newEnvMap;
            house.material.needsUpdate = true;

            planeMesh.material.map = newEnvMap;
            planeMesh.material.needsUpdate = true;

        }
    }

    // house.rotation.y += 0.005;
    planeMesh.visible = false;

    scene.background = cubeMap;
    renderer.toneMappingExposure = params.exposure;

    // renderer.render( scene, camera );
    updatePointLights()
    composer.render();

}