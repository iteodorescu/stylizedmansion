if ( WEBGL.isWebGLAvailable() === false ) {

    document.body.appendChild( WEBGL.getWebGLErrorMessage() );

}



var container, stats;
var camera, scene, renderer, controls;
var house;
var torusMesh, planeMesh;
var renderTarget, cubeMap;
var composer;
var effectSobel;

var passes = {}

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 0, 120 );

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

    torusMesh = new THREE.Mesh( geometry, material );
    // scene.add( torusMesh );


    var geometry = new THREE.PlaneBufferGeometry( 200, 200 );
    var material = new THREE.MeshBasicMaterial();

    planeMesh = new THREE.Mesh( geometry, material );
    planeMesh.position.y = - 50;
    planeMesh.rotation.x = - Math.PI * 0.5;
    scene.add( planeMesh );

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
        `../obj/${filename}.obj`,
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


function onWindowResize() {

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
    object.position.y = -60
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
            var material = new THREE.MeshBasicMaterial( {
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
    composer.render();

}