if ( WEBGL.isWebGLAvailable() === false ) {

    document.body.appendChild( WEBGL.getWebGLErrorMessage() );

}
var params = {
    env: 'Citadella2',
    roughness: 0.0,
    metalness: 0.0,
    exposure: 1.0
};

var container, stats;
var camera, scene, renderer, controls;
var house;
var torusMesh, planeMesh;
var renderTarget, cubeMap;
var composer;
var effectSobel;

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

    var gui = new dat.GUI();

    
    var handler = gui.add( params, 'env', ['Citadella2', 'Lycksele3'] ); // not working yet

    handler.onChange(function() {
        setCubeMap()
    })


    composer = new THREE.EffectComposer(renderer);

    var renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // var sepiaPass = new THREE.ShaderPass(THREE.SepiaShader);
    // composer.addPass(sepiaPass);

    // var effectGrayScale = new THREE.ShaderPass( THREE.LuminosityShader );
    // composer.addPass( effectGrayScale );
    
    // var glitchPass = new THREE.GlitchPass(0);
    // composer.addPass(glitchPass);

     //custom shader pass
    
    
    addCustomShader(toon)


    // gui.add( params, 'roughness', 0, 1, 0.01 );
    // gui.add( params, 'metalness', 0, 1, 0.01 );
    gui.add( params, 'exposure', 0, 2, 0.01 );
    gui.open();

}

function addCustomShader(name) {
    var customPass = new THREE.ShaderPass(toon);
    composer.addPass(customPass);
}

function addObject (filename) {
    var loader = new THREE.OBJLoader();
    var material = new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        metalness: params.metalness,
        roughness: params.roughness
    } );

    // loader.setMaterials([material])
    // load a resource
    loader.load(
        // resource URL
        `../obj/${filename}.obj`,
        // called when resource is loaded
        function ( object ) {
            if (filename === 'house') house = object
            
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
    // lon += .15;

    // lat = Math.max( - 85, Math.min( 85, lat ) );
    // phi = THREE.Math.degToRad( 90 - lat );
    // theta = THREE.Math.degToRad( lon );

    if (house) {

        // house.material.roughness = params.roughness;
        // house.material.metalness = params.metalness;


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


///// for dynamic movement/ rotation

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;
var lon = 0, lat = 0;
var phi = 0, theta = 0;

function onDocumentMouseDown( event ) {
    event.preventDefault();
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
}
function onDocumentMouseMove( event ) {
    lon = ( event.clientX - onPointerDownPointerX ) * 0.1 + onPointerDownLon;
    lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
}
function onDocumentMouseUp() {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
}
function onDocumentMouseWheel( event ) {
    var fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.Math.clamp( fov, 10, 75 );
    camera.updateProjectionMatrix();
}