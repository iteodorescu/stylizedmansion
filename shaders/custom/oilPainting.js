/**
 * inspired from:
 * https://www.reddit.com/r/shaders/comments/5e7026/help_making_an_oil_paint_post_processing_shader/
 */

var oilPainting = {

	uniforms: {

        //"lightDir": { value: null},
        "tDiffuse": { value: null },
        // "radius": {value: 3},
        "v":        { value: 1.0 / 512.0 }
	},

	vertexShader: [
        "varying vec2 vUv;",
        "void main()",
        "{",
            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
/*
            "normal = gl_Normal;",
            "gl_Position = ftransform();",*/
        "}"

	].join( "\n" ),

	fragmentShader: [
                "uniform sampler2D tDiffuse;",
                "uniform float v;",
                // "uniform int radius;",
                "varying vec2 vUv;",

                "void main () {",
                "int radius = 10;",
                // "vec4 color = texture2D(tDiffuse, vUv);",
                

                // "    vec2 src_size = textureSize2D(tDiffuse , 0);",
                // "    vec2 uv = vUv;",
                // // gl_FragCoord.xy / src_size ;",
                "    float n = float (( radius + 1) * ( radius + 1));",
                "    vec3 m[4];",
                "    vec3 s[4];",
                "    for (int k = 0; k < 4; ++ k) {",
                "        m[k] = vec3(0.0);",
                "        s[k] = vec3(0.0);",
                "    }",

                "       for (int j = -10; j <= 0; j++) {",
                "            for (int i = -10; i <= 0; i++) {",
                "               float x = float(i);",
                "               float y = float(j);",
                "               vec2 v2 = vec2( vUv.x + x * v, vUv.y + y * v);",
                "                vec4 color = texture2D(tDiffuse , v2);",
                "                vec3 c = color.rgb;",
                "                m[0] += c;",
                "                s[0] += c * c;",
                "            }",
                "        }",

                "       for (int j = -10; j <= 0; j++) {",
                "            for (int i = 0; i <= 10; i++) {",
                "               float x = float(i);",
                "               float y = float(j);",
                "               vec2 v2 = vec2( vUv.x + x * v, vUv.y + y * v);",
                "                vec4 color = texture2D(tDiffuse , v2);",
                "                vec3 c = color.rgb;",
                "                m[1] += c;",
                "                s[1] += c * c;",
                "            }",
                "        }",

                "       for (int j = 0; j <= 10; j++) {",
                "            for (int i = 0; i <= 10; i++) {",
                "               float x = float(i);",
                "               float y = float(j);",
                "               vec2 v2 = vec2( vUv.x + x * v, vUv.y + y * v);",
                "                vec4 color = texture2D(tDiffuse , v2);",
                "                vec3 c = color.rgb;",
                "                m[2] += c;",
                "                s[2] += c * c;",
                "            }",
                "        }",

                "       for (int j = 0; j <= 6; j++) {",
                "            for (int i = -6; i <= 0; i++) {",
                "               float x = float(i);",
                "               float y = float(j);",
                "               vec2 v2 = vec2( vUv.x + x * v, vUv.y + y * v);",
                "                vec4 color = texture2D(tDiffuse , v2);",
                "                vec3 c = color.rgb;",
                "                m[3] += c;",
                "                s[3] += c * c;",
                "            }",
                "        }",

                "    float min_sigma2 = 1e+2;",
                "    for (int k = 0; k < 4; ++ k) {",
                "        m[k] /= n;",
                "        s[k] = abs (s[k] / n - m[k] * m[k]);",
                "        float sigma2 = s[k].r + s[k].g + s[k].b;",
                "        if ( sigma2 < min_sigma2 ) {",
                "            min_sigma2 = sigma2 ;",
                "            gl_FragColor = vec4 (m[k], 1.0);",
                "        }",
                "    }",
                "}"

	].join( "\n" )

};