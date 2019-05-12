/**
 * inspired from:
 * https://prideout.net/blog/old/blog/index.html@p=22.html
 */

THREE.SepiaShader = {

	uniforms: {

		"tDiffuse": { value: null },
        "amount":   { value: 1.0 },
        "Projection": {value: null},
        "mat4 Modelview": {value: null},
        "mat3 NormalMatrix": {value: null},
        "vec3 DiffuseMaterial": {value: null}
	},

	vertexShader: [

		"layout(location = 0) in vec3 in_position;",
        "layout(location = 1) in vec3 in_normal;",
        
        "uniform mat4 model_matrix, view_matrix, projection_matrix;",
        
        //send them to fragment shader
        "out vec3 world_pos;",
        "out vec3 world_normal;",
        
        "void main() {",
        
        //convert in world coords
        "world_pos = mat3(model_matrix) * in_position;//careful here",
        "world_normal = normalize(mat3(model_matrix) * in_normal);",
        "gl_Position = projection_matrix*view_matrix*model_matrix*vec4(in_position,1);",
    "}"

	].join( "\n" ),

	fragmentShader: [
        "layout(location = 0) out vec4 out_color;",
 
        "uniform vec3 light_position;",
        "uniform vec3 eye_position;",
        
        "uniform int material_shininess;",
        "uniform float material_kd;",
        "uniform float material_ks;",
        
        "in vec3 world_pos;",
        "in vec3 world_normal;",
        
        "void main() {",
        "vec3 L = normalize( light_position - world_pos);",
        "vec3 V = normalize( eye_position - world_pos);",
        "vec3 H = normalize(L + V );",
        
        "float diffuse = material_kd * max(0, dot(L,world_normal));",
        "float specular = 0;",
        
        "if( dot(L,world_normal) > 0.0) {",
            "specular = material_ks * pow( max(0, dot( H, world_normal)), material_shininess);",
        "}",
        
        //Black color if dot product is smaller than 0.3
        //else keep the same colors
        "float edgeDetection = (dot(V, world_normal) > 0.3) ? 1 : 0;",
        
        "float light = edgeDetection * (diffuse + specular);",
        "vec3 color = vec3(light,light,light);",
        
        "out_color = vec4(color,1);",
        "}"

	].join( "\n" )

};