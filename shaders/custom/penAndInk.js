var penAndInk = {
    uniforms: {
        "tDiffuse": { value: null },
        "amount":   { value: 1.0 }
    },
    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
    ].join( "\n" ),
    fragmentShader: [
        "uniform float amount;",
        "uniform sampler2D tDiffuse;",
        "varying vec2 vUv;",
        "mat3 sx = mat3(      ",
        "    1.0, 2.0, 1.0, ",
        "    0.0, 0.0, 0.0, ",
        "   -1.0, -2.0, -1.0 ",
        ");",
        "mat3 sy = mat3( ",
        "    1.0, 0.0, -1.0, ",
        "    2.0, 0.0, -2.0, ",
        "    1.0, 0.0, -1.0 ",
        ");",
        "vec2 TexCoords;",
        "vec4 color;",
        "void main() {",
            "vec3 diffuse = texture(tDiffuse, TexCoords.st).rgb;",
            "mat3 I;",
            "for (int i=0; i<3; i++) {",
                "for (int j=0; j<3; j++) {",
                    "vec3 sample  = texelFetch(screenTexture, ivec2(gl_FragCoord) + ivec2(i-1,j-1), 0 ).rgb;",
                    "I[i][j] = length(sample); ",
                "}",
            "}",
            "float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); ",
            "float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]); ",
            "float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));",

            "vec4 color = texture2D( tDiffuse, vUv );",
            "vec3 c = color.rgb;",
            "color.r = c.r * 2.0;",
            "color.g = c.g / 1.2;",
            "color.b = c.b;",
            "gl_FragColor = vec4( color.rgb , color.a );",
            "color = vec4(diffuse - vec3(g), 1.0);",
        "}"
    ].join( "\n" )
}