var links = document.querySelectorAll( 'a[rel=external]' );
for( var j = 0; j < links.length; j++ ) {
    var a = links[ j ];
    a.addEventListener( 'click', function( e ) {
        window.open( this.href, '_blank' );
        e.preventDefault();
    }, false );
}
var container, renderer, scene, camera, mesh, fov = 45;
var start = Date.now();
var controls;
var start = Date.now();
	var x = 0, y = 0, z = 0;
var clock = new THREE.Clock();
var lon = 90, lat = -0, position = { x: 90, y: -0 }, isUserInteracting = false, onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;
var composer, composer2, composer3, pass, pass2, pass3, colorBuffer, blurBuffer, blurShader;
var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
var meshes = [];
window.addEventListener( 'load', init );
function init() {
	container = document.getElementById( 'container' );
	scene = new THREE.Scene();
	scene.position = new THREE.Vector3( 0,0,0 );
	camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 0, 10, 10 );
	camera.target = new THREE.Vector3( 0, 0, 0 );
	scene.add( camera );
	renderer = new THREE.WebGLRenderer( { antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
	material = new THREE.ShaderMaterial( {
		uniforms: {
			renderDepth: { type: 'i', value: 0 }
		},
		vertexShader: document.getElementById( 'vs-post' ).textContent,
		fragmentShader: document.getElementById( 'fs-post' ).textContent,
		shading: THREE.SmoothShading,
		transparent: true
	} );
	var cubeGeometry = new THREE.CubeGeometry( 1, 1, 1 );
	var geometry = new THREE.Geometry();
	var s = 3;
	var d = 40;
	for( var j = 0; j < 200; j++ ){
		mesh = new THREE.Mesh( cubeGeometry, material );
		mesh.scale.set( 1 + Math.random() * s, 1 + Math.random() * s, 1 + Math.random() * s );
		mesh.position.set( ( .5 - Math.random() ) * d, ( .5 - Math.random() ) * d, ( .5 - Math.random() ) * d );
		mesh.rotation.set( Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI );
		scene.add( mesh );
		meshes.push( mesh );
	}
	var l = new THREE.Mesh( new THREE.SphereGeometry( 1, 20, 20 ), new THREE.MeshNormalMaterial() );
	scene.add( l );
	l.position.set( 0, 0, -10 );
	THREE.BlurShader = {
		uniforms: {
			tDiffuse: { type: 't', value: null },
			delta: { type: 'v2', value: new THREE.Vector2( .01, .01) }
		},
		vertexShader: document.getElementById( 'vs-downsample' ).textContent,
		fragmentShader: document.getElementById( 'fs-downsample' ).textContent
	};
	colorBuffer = new THREE.WebGLRenderTarget( 1, 1, parameters );
	blurBuffer = new THREE.WebGLRenderTarget( 1, 1, parameters );
	composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );
	shader = {
		uniforms: {
			tDiffuse: { type: 't', value: null },
			tColor: { type: 't', value: null },
			tBlur: { type: 't', value: null },
			tNoise: { type: 't', value: new THREE.TextureLoader().load( 'assets/noise.png' ) },
			tPaper: { type: 't', value: new THREE.TextureLoader().load( 'assets/brown.jpg' ) },
			resolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) }
		},
		vertexShader: document.getElementById( 'vs-render' ).textContent,
		fragmentShader: document.getElementById( 'fs-render' ).textContent
	}
	pass = new THREE.ShaderPass( shader );
	pass.renderToScreen = true;
	composer.addPass( pass );
	var v = .1;
	composer2 = new THREE.EffectComposer( renderer );
	composer2.addPass( new THREE.RenderPass( scene, camera ) );
	pass2 = new THREE.ShaderPass( THREE.BlurShader );
	pass2.uniforms.delta.value.set( 0, v );
	composer2.addPass( pass2 );
	pass3 = new THREE.ShaderPass( THREE.BlurShader );
	pass3.uniforms.delta.value.set( v, 0 );
	composer2.addPass( pass3 );
	onWindowResize();
	render();
}
function onWindowResize() {
	renderer.setSize( window.innerWidth, window.innerHeight );
	composer.setSize( window.innerWidth, window.innerHeight );
	composer2.setSize( window.innerWidth / 2, window.innerHeight / 2 );
	camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, camera.near, camera.far );
	pass.uniforms.resolution.value.set( window.innerWidth, window.innerHeight );
	colorBuffer.setSize( window.innerWidth, window.innerHeight );
	var s = 1;
	blurBuffer.setSize( Math.floor( window.innerWidth / s ), Math.floor( window.innerHeight / s ) );
}
function render() {
	controls.update();
	var ellapsedFactor = clock.getDelta();
	renderer.setClearColor( 0xffffff );
	mesh.material.uniforms.renderDepth.value = 0;
	renderer.render( scene, camera, colorBuffer );
	composer2.render();
	pass.uniforms.tColor.value = colorBuffer;
	pass.uniforms.tBlur.value = composer2.readBuffer.texture;
	mesh.material.uniforms.renderDepth.value = 1;
	renderer.setClearColor( 0x808000 );
	composer.render();
	for( var j = 0; j < meshes.length; j++ ) {
		meshes[ j ].rotation.x += ellapsedFactor * .1;
		meshes[ j ].rotation.y += ellapsedFactor * .11;
		meshes[ j ].rotation.z += ellapsedFactor * .12;
	}
	requestAnimationFrame( render );
}