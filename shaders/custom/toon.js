/**
 * inspired from:
 * https://prideout.net/blog/old/blog/index.html@p=22.html
 */

var toon = {

	uniforms: {

		"lightDir": { value: null},

	},

	vertexShader: [

        "varying vec3 normal; ",
        "varying vec2 vUv;",
        "void main()",
        "{",
            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "normal = gl_Normal;",
            "gl_Position = ftransform();",
        "}"

	].join( "\n" ),

	fragmentShader: [
        "uniform vec3 lightDir; ",
        "varying vec3 normal;",
        

        "void main()",
        "{",
            "float intensity;",
            "vec4 color;",
            "intensity = dot(lightDir,normal);",

            "if (intensity > 0.95) {",
                "color = vec4(1.0, 0.5, 0.5, 1.0); }",
            "else if (intensity > 0.5)",
                "color = vec4(0.6, 0.3, 0.3, 1.0);",
            "else if (intensity > 0.25) {",
                "color = vec4(0.4, 0.2, 0.2, 1.0); }",
            "else {",
                "color = vec4(0.2, 0.1, 0.1, 1.0); }",
            "gl_FragColor = color;",

        "}"

	].join( "\n" )

};