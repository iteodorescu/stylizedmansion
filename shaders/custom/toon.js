/**
 * inspired from:
 * https://prideout.net/blog/old/blog/index.html@p=22.html
 */

var toon = {

	uniforms: {

        //"lightDir": { value: null},
        "tDiffuse": { value: null }

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
       /* "uniform vec3 lightDir; ",
        "varying vec3 normal;",*/
        "uniform sampler2D tDiffuse;",
        "varying vec2 vUv;",
        

        "vec3 toHsl(vec3 rgb) {",
        "    float r = rgb.r;",
        "    float g = rgb.g;",
        "    float b = rgb.b;",
        "    float EPStech = 1.0e-3;",
        "    float h,s,l;",
        "    float maximum = max(max(r,g), b);",
        "    float minimum = min(min(r,g),b);",
        "    l = (maximum + minimum) / 2.0;",
        "    if (maximum == minimum) {",
        "        h = 0.0;",
        "        s = 0.0;",
        "    }",
        "    else {",
        "        float d = maximum - minimum;",
        "        if (l > 0.5) {",
        "        s = d / (2.0 - maximum - minimum);",
        "        }",
        "        else {",
        "        s = d / (maximum + minimum);",
        "        }",
        "        float temp1 = abs(maximum - r);",
        "        float temp2 = abs(maximum - g);",
        "        float temp3 = abs(maximum - b);",
        "        if (temp1 < EPStech) {",
        "        float t;",
        "        if (g < b) {",
        "            t = 6.0;",
        "        }",
        "        else {",
        "            t = 0.0;",
        "        }",
        "        h = (g - b) / d + t;",
        "        }",
        "        else if (temp2 < EPStech) {",
        "        h = (b - r) / d + 2.0;",
        "        }",
        "        else {",
        "        h = (r - g) / d + 4.0;",
        "        }",
        "        h = h/ 6.0;",
        "    }",
        "    return vec3(h,s,l);",
        "}",

        "float hueToRGB(float m1, float m2, float h) {                          ",
        "    if (h < 0.0) {",
        "      h = h + 1.0;",
        "    }",
        "    else if (h > 1.0) {",
        "      h = h - 1.0;",
        "    }",
        "    // h = h < 0.0 ? h + 1.0 : h > 1.0 ? h - 1.0 : h;",
        "    if (h * 6.0 < 1.0) return m1 + (m2 - m1) * h * 6.0;",
        "    if (h * 2.0 < 1.0) return m2;",
        "    if (h * 3.0 < 2.0) return m1 + (m2 - m1) * (0.66666 - h) * 6.0;",
        "    return m1;",
        "}",

        "vec3 fromHSL(vec3 sample) {                            ",
        "    float h = sample.r;",
        "    float s = sample.g;",
        "    float l = sample.b;",
        "    float m1;",
        "    float m2;",
        "    if (l <= 0.5) {",
        "      m2 = l * (s + 1.0);",
        "    }",
        "    else {",
        "      m2 = l + s - l * s;",
        "    }",
        "    // m2 = l <= 0.5 ? l * (s + 1.0) : l + s - l * s;",
        "    m1 = l * 2.0 - m2;",
        "    float r = hueToRGB(m1, m2, h + 1.0 / 3.0);",
        "    float g = hueToRGB(m1, m2, h);",
        "    float b = hueToRGB(m1, m2, h - 1.0 / 3.0);",
        "    return vec3(r,g,b);",
        "}",


        "void main() {                              ",
        "    vec2 p = vUv;",
        "    vec4 color = texture2D(tDiffuse, p);",
        "    vec3 nsom = toHsl(color.rgb);",
        "    if (nsom.b > 0.8){",
        "      nsom.b = 0.9;",
        "    }",
        "    else if (nsom.b > 0.5){",
        "      nsom.b = 0.5;",
        "    }",
        "    else {",
        "      nsom.b = 0.2;",
        "    }",
        "    vec3 temp = fromHSL(nsom);",
        "     gl_FragColor.rgb = temp;",
        "}"

//         "void main()",
//         "{",
//             "vec2 p = vUv;",
//             // "float intensity;",
//             "vec4 color = texture2D(tDiffuse, p);",
//             /*
//             "intensity = dot(lightDir,normal);",*/

// /*
//             "if (intensity > 0.95) {",
//                 "color = vec4(1.0, 0.5, 0.5, 1.0); ",
//             "}",
//             "else if (intensity > 0.5)",
//                 "color = vec4(0.6, 0.3, 0.3, 1.0);",
//             "else if (intensity > 0.25) {",
//                 "color = vec4(0.4, 0.2, 0.2, 1.0);",
//             "}",
//             "else {",
//                 "color = vec4(0.2, 0.1, 0.1, 1.0);" ,
//             "}",
//             */
//             "gl_FragColor = color;",

//         "}"

	].join( "\n" )

};