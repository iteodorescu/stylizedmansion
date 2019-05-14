var sketch3 = {
    uniforms: {
        "tDiffuse": {value: null},
        "tColor": {value: null},
        "tNoise": { type: 't', value: new THREE.TextureLoader().load( './assets/noise.png' ) },
        "tPaper": { type: 't', value: new THREE.TextureLoader().load( './assets/brown.jpg' ) },
        "tBlur": {value: null},
        "resolution":  { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
        "delta": {type: 'v2', value: new THREE.Vector2(.1,0)}

    },
    vertexShader: [
        "varying vec2 vUv;",

        "void main() {",
            "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
            "gl_Position = projectionMatrix * mvPosition;",
            "vUv = uv;",
        "}"
    ].join( "\n" ),
    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform sampler2D tColor;",
        "uniform sampler2D tNoise;",
        "uniform sampler2D tPaper;",
        "uniform sampler2D tBlur;",
        "uniform vec2 resolution;",
        "varying vec2 vUv;",
        
        "void main() {",
            "float x = 1.0 / resolution.x;                                                                          ",
            "float y = 1.0 / resolution.y;",
            "vec4 horizEdge = vec4( 0.0 );",
            "horizEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y - y ) ) * 1.0;",
            "horizEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y     ) ) * 2.0;",
            "horizEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y + y ) ) * 1.0;",
            "horizEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y - y ) ) * 1.0;",
            "horizEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y     ) ) * 2.0;",
            "horizEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y + y ) ) * 1.0;",
            "vec4 vertEdge = vec4( 0.0 );",
            "vertEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y - y ) ) * 1.0;",
            "vertEdge -= texture2D( tDiffuse, vec2( vUv.x    , vUv.y - y ) ) * 2.0;",
            "vertEdge -= texture2D( tDiffuse, vec2( vUv.x + x, vUv.y - y ) ) * 1.0;",
            "vertEdge += texture2D( tDiffuse, vec2( vUv.x - x, vUv.y + y ) ) * 1.0;",
            "vertEdge += texture2D( tDiffuse, vec2( vUv.x    , vUv.y + y ) ) * 2.0;",
            "vertEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y + y ) ) * 1.0;",
            "vec3 edge = sqrt((horizEdge.rgb * horizEdge.rgb) + (vertEdge.rgb * vertEdge.rgb));",
            "float e = length( edge );",
            "float z = texture2D( tDiffuse, vUv ).b;",
            "vec3 b = texture2D( tColor, vUv ).rgb;",
            "vec3 a = texture2D( tBlur, vUv ).rgb;",
            "vec3 c = vec3( 1. ) - ( vec3( 1. ) - a ) * ( vec3( 1. ) - b );",
            "vec2 nUV = vec2( mod( vUv.x * resolution.x / 256., 1. ), mod( vUv.y * resolution.y / 256., 1. ) );",
            "float s = mix( 1., texture2D( tNoise, nUV ).r, 1. - c.r );",
            "s -= .15 * e * z;",
            "vec2 pUV = vec2( mod( vUv.x * resolution.x / 1200., 1. ), mod( vUv.y * resolution.y / 1200., 1. ) );",
            "vec3 color = texture2D( tPaper, pUV ).rgb * s;",
            "gl_FragColor = vec4( color, 1. );",
        "}"
    ].join( "\n" )
}