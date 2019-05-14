var params = {
    env: 'Lundagatan',
    roughness: 0.0,
    metalness: 0.0,
    exposure: 1.0,
    pointLights: true,
    directionalLight: 0.05
};

var threejsShaders = [
    'BasicShader', 
    'BleachBypassShader', 
    'BlendShader', 
    'BokehShader', 
    'BokehShader2', 
    'ColorifyShader', // done
    'ConvolutionShader', 
    'DepthLimitedBlurShader', 
    'DigitalGlitch', 
    'DotScreenShader', 
    'FilmShader', ////// not working
    'FreiChenShader', 
    'FresnelShader', 
    'HalftoneShader', 
    'HueSaturationShader', 
    'KaleidoShader', 
    'LuminosityShader', 
    'ParallaxShader', 
    'PixelShader', // done
    'SepiaShader', 
    'SobelOperatorShader', 
    'TechnicolorShader', // done
    'ToneMapShader', 
    'VerticalBlurShader', // done
    'VerticalTiltShiftShader', 
    'VignetteShader', // done
]

var envOptions = ['Areskutan', 'Citadella2', 'Lundagatan', 'Lycksele3', 'Meadow', 'Tantolunden', 'Tantolunden3', 'Tantolunden4', 'Tenerife2']

function guiInit() {
    var gui = new dat.GUI();

    var handler = gui.add( params, 'env', envOptions );

    handler.onChange(function() {
        setCubeMap()
    })

    gui.add( params, 'exposure', 0, 2, 0.01 );

    var pLightsHandler = gui.add( params, 'pointLights' );
    pLightsHandler.onChange(updateVisPointLights)

    var dlightHandler = gui.add( params,'directionalLight', 0, 0.7, 0.01 )
    dlightHandler.onChange(updateDirLight)

    var fThreejs = gui.addFolder("ThreeJS Shaders")
    var fCustom = gui.addFolder("Custom Shaders")

    setUpCustomShaders(fCustom)
    setUpThreejsShaders(fThreejs)

    gui.open();
}

// CUSTOM SHADERS

var customShaders = ['oilPainting', 'toon']

function setUpCustomShaders(fCustom) {
    customShaders.forEach((shader) => {
        params[shader] = false

        var handler = fCustom.add(params, shader)
        handler.onChange((val) => {
            console.log(params[shader])
            if (params[shader]) {
                if (passes[shader]) passes[shader].enabled = true
                else {
                    var pass = addCustomShader(window[shader])
                    passes[shader] = pass
                }
            }
            else {
                passes[shader].enabled = false
            }
        })
    })

    // params['sketch'] = false

    // var handler = fCustom.add(params, 'sketch')
    // handler.onChange((val) => {
    //     if (params['sketch']) {
    //         if (passes['sketch']) {
    //             passes['sketch'].enabled = true
    //         }
    //         else {
    //             var pass = addCustomShader(window['sketch'])
    //             passes['sketch'] = pass
    //         }
    //     }
    //     else {
    //         passes['sketch'].enabled = false

    //     }
    // })
}

// THREEJS SHADERS
function setUpThreejsShaders(fThreejs) {
    blur(fThreejs)
    colorify(fThreejs)
    pixel(fThreejs)
    dotScreen(fThreejs)
    technicolor(fThreejs)
    vignette(fThreejs)
}

function blur(f) {
    var shader = 'blur'
    params[shader] = false

    var handler = f.add(params, shader)
    handler.onChange((val) => {
        if (params[shader]) {
            if (passes[shader]) passes[shader].enabled = true
            else {
                var pass = addCustomShader(THREE.VerticalBlurShader)
                passes[shader] = pass
            }
        }
        else {
            passes[shader].enabled = false
        }
    })
}

function pixel(f) {
    var shader = 'pixel'
    params[shader] = 0

    var handler = f.add(params, shader, 0, 100)
    handler.onChange((val) => {
        if (params[shader] > 0) {
            if (passes[shader]) {
                passes[shader].enabled = true
                passes[shader].uniforms[ "pixelSize" ].value = val
            }
            else {
                var pass = addCustomShader(THREE.PixelShader)
                pass.uniforms[ "resolution" ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
				pass.uniforms[ "resolution" ].value.multiplyScalar( window.devicePixelRatio );
                pass.uniforms[ "pixelSize" ].value = val
                passes[shader] = pass
            }
        }
        else {
            passes[shader].enabled = false
        }
    })
}


function colorify(f) {
    var shader = 'colorify'
    params[shader] = false
    params['color'] = new THREE.Color( 0xffffff )

    var colorHandler = f.addColor(params, 'color')
    colorHandler.onChange((val) => {
        if (params[shader]) {
            if (passes[shader]) {
                passes[shader].enabled = true
                passes[shader].uniforms['color'].value = params.color
            }
            else {
                var pass = addCustomShader(THREE.ColorifyShader)
                pass.uniforms['color'].value = params.color
                passes[shader] = pass
            }
        }
    })


    var handler = f.add(params, shader)
    handler.onChange((val) => {
        if (params[shader]) {
            if (passes[shader]) {
                passes[shader].enabled = true
                passes[shader].uniforms['color'].value = params.color
            }
            else {
                var pass = addCustomShader(THREE.ColorifyShader)
                pass.uniforms['color'].value = params.color
                passes[shader] = pass
            }
        }
        else {
            passes[shader].enabled = false
        }
    })
}

function dotScreen(f) {
    var shader = 'dotScreen'
    params[shader] = false

    var handler = f.add(params, shader)
    handler.onChange((val) => {
        if (params[shader]) {
            if (passes[shader]) passes[shader].enabled = true
            else {
                var pass = addCustomShader(THREE.DotScreenShader)
                pass.uniforms['scale'].value = 4
                passes[shader] = pass
            }
        }
        else {
            passes[shader].enabled = false
        }
    })
}


function technicolor(f) {
    var shader = 'technicolor'
    params[shader] = false

    var handler = f.add(params, shader)
    handler.onChange((val) => {
        if (params[shader]) {
            if (passes[shader]) passes[shader].enabled = true
            else {
                var pass = addCustomShader(THREE.TechnicolorShader)
                passes[shader] = pass
            }
        }
        else {
            passes[shader].enabled = false
        }
    })
}

function vignette(f) {
    var shader = 'vignette'
    params[shader] = false

    var handler = f.add(params, shader)
    handler.onChange((val) => {
        if (params[shader]) {
            if (passes[shader]) passes[shader].enabled = true
            else {
                var pass = addCustomShader(THREE.VignetteShader)
                passes[shader] = pass
            }
        }
        else {
            passes[shader].enabled = false
        }
    })
}




