'use strict';

/*


    SAMPLES
    
    DUMBELL LAKE: '{"loc1":{"lat":51.387262679922394,"lng":-124.95635032653809},"loc2":{"lat":51.3937968903196,"lng":-124.94981611614088}}'
    BONEY MOUNTAIN: '{"loc1":{"lat":34.10615485,"lng":-118.96277189},"loc2":{"lat":34.11411407,"lng":-118.95481267000002}}'
    MOUNT EVEREST: '{"loc1":{"lat":27.95995474,"lng":86.89309708},"loc2":{"lat":28.02816409,"lng":86.96622483}}'
    MAATSUYKER ISLAND: '{"loc1":{"lat":-43.660296639011534,"lng":146.26454830169678},"loc2":{"lat":-43.63657210502274,"lng":146.28827283568558}}'
    CAPE OF GOOD HOPE: '{"loc1":{"lat":-34.365969031253414,"lng":18.472180366516113},"loc2":{"lat":-34.33875865682487,"lng":18.49939074094459}}'
    PULAU NILA: '{"loc1":{"lat":-6.7703069640581335,"lng":129.47739601135254},"loc2":{"lat":-6.700070564556916,"lng":129.5476324108538}}'
    PULAU TEUN: '{"loc1":{"lat":-6.992881489223878,"lng":129.12081241607666},"loc2":{"lat":-6.947386633999832,"lng":129.16630727130064}}'
    GN. AGUNG: '{"loc1":{"lat":-8.389846472251,"lng":115.4593563079834},"loc2":{"lat":-8.301527837544905,"lng":115.54767494268947}}'
    
    Some random place that looks cool: '{"loc1":{"lat":28.002131503366588,"lng":86.70474529266357},"loc2":{"lat":28.02531845271483,"lng":86.72793224201178}}'

*/

const SAMPLES = [
    
    '{"loc1":{"lat":51.387262679922394,"lng":-124.95635032653809},"loc2":{"lat":51.3937968903196,"lng":-124.94981611614088}}',  //DUMBELL LAKE
    '{"loc1":{"lat":34.10615485,"lng":-118.96277189},"loc2":{"lat":34.11411407,"lng":-118.95481267000002}}',                    //BONEY MOUNTAIN
    '{"loc1":{"lat":27.95995474,"lng":86.89309708},"loc2":{"lat":28.02816409,"lng":86.96622483}}',                              //MOUNT EVEREST
    '{"loc1":{"lat":-43.660296639011534,"lng":146.26454830169678},"loc2":{"lat":-43.63657210502274,"lng":146.28827283568558}}', //MAATSUYKER ISLAND
    '{"loc1":{"lat":-34.365969031253414,"lng":18.472180366516113},"loc2":{"lat":-34.33875865682487,"lng":18.49939074094459}}',  //CAPE OF GOOD HOPE
    '{"loc1":{"lat":-6.7703069640581335,"lng":129.47739601135254},"loc2":{"lat":-6.700070564556916,"lng":129.5476324108538}}',  //PULAU NILA
    '{"loc1":{"lat":-6.992881489223878,"lng":129.12081241607666},"loc2":{"lat":-6.947386633999832,"lng":129.16630727130064}}',  //PULAU TEUN
    '{"loc1":{"lat":-8.389846472251,"lng":115.4593563079834},"loc2":{"lat":-8.301527837544905,"lng":115.54767494268947}}'       //GN. AGUNG:

];
const random = () => selectionManager.import(SAMPLES[Math.random() * SAMPLES.length | 0]);


window.onload = function(){

    if(Detector.webgl){

        init();
        requestAnimationFrame(frame);

    } else {

        var warning = Detector.getWebGLErrorMessage();
        document.getElementById('container').appendChild(warning);

    }

};

let selectionManager;
let map;
let elevator;
let elevationMap;
let scene;
let camera;
let renderer;
let controls;
let rotationSpeedSlider;
let terrain;
let stats;
let sizeX = 15;
let sizeY = 15;
let width = 30;
let height = 30;
let cs = 0.50; //canvas scalar
let now = timestamp();
let last = 0;
let dt = 0;
let accumulation = 0;
let fps = 0;
let rotationSpeed = 0.6;
let spinGeometry = true;
const step = 1/60;
const LatLng = google.maps.LatLng;
const defaultLocation1 = new LatLng(27.95995474, 86.89309708);
const defaultLocation2 = new LatLng(28.02816409, 86.966224837);
//const defaultLocation1 = new LatLng(34.10615485, -118.96277189);
//const defaultLocation2 = new LatLng(34.11411407, -118.95481267);

function init(){
    
    initMap();
    selectionManager = new SelectionManager();
    initDrawingControls(selectionManager);
    
    initTHREE();
    initLighting();
    initControls();
    initTerrain();
    initStatistics();
    
    go();   
    
}

function resetOrientation(){
 
    terrain.rotation.set(-Math.PI/2, Math.PI, Math.PI);
    controls.reset()
    
    //camera.fov *= 04;
    //camera.updateProjectionMatrix();
    
}

function go(){
    
    constructElevationMap(selectionManager.reqLoc1, selectionManager.reqLoc2, width + 1, height + 1);
    
}



function initMap(){
    
    let mapOptions = {
        
        center: new google.maps.LatLng(39.000, -98.000),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.TERRAIN //ROADMAP, SATTELITE
        
    };
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    var acOptions = {
      //types: ['establishment']
    };
    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('autocomplete'),acOptions);
    autocomplete.bindTo('bounds',map);
    
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        
        //infoWindow.close();
        var place = autocomplete.getPlace();
        
        if (place.geometry.viewport) {
            
            map.fitBounds(place.geometry.viewport);
        
        } else {
        
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            
        }
        
        /*
        marker.setPosition(place.geometry.location);
        infoWindow.setContent('<div><strong>' + place.name + '</strong><br>');
        infoWindow.open(map, marker);
        google.maps.event.addListener(marker,'click',function(e){

            infoWindow.open(map, marker);

        });
        */
        
    });

    map.setCenter(defaultLocation1);
    elevator = new google.maps.ElevationService;
    
}

function initDrawingControls(selectionManager){
    
    google.maps.event.addListener(map, 'rightclick', function(e){
        
        if(this.cycle === 0) this.reqLoc1 = e.latLng;
        else if(this.cycle === 1){
            
            //this.loc2 = e.latLng;
            this.reqLoc2 = this.squarify(e.latLng);
            
            
            go();
            
        }
        
        this.cycle ^= 1;
        console.log(e.latLng.lat(), e.latLng.lng());
        
    }.bind(selectionManager));
    
}

function SelectionManager(loc1, loc2){
    
    this.loc1 = loc1 || defaultLocation1;
    this.loc2 = loc2 || defaultLocation2;
    this.reqLoc1 = this.loc1;
    this.reqLoc2 = this.loc2;
    
    this.map = map;
    
    this.getRectangleDestinations = function(){
        
        const lat1 = Math.min(this.reqLoc1.lat(), this.reqLoc2.lat());
        const lng1 = Math.min(this.reqLoc1.lng(), this.reqLoc2.lng());
        const lat2 = Math.max(this.reqLoc1.lat(), this.reqLoc2.lat());
        const lng2 = Math.max(this.reqLoc1.lng(), this.reqLoc2.lng());
        
        return [
            new LatLng(lat1, lng1),
            new LatLng(lat1, lng2),
            new LatLng(lat2, lng2),
            new LatLng(lat2, lng1),
        ];
        
        
        
    };
    
    this.squarify = function(loc){
        
        let small = Math.abs(this.reqLoc1.lat() - loc.lat()) < Math.abs(this.reqLoc1.lng() - loc.lng()) ? loc.lat() - this.reqLoc1.lat() : loc.lng() - this.reqLoc1.lng();
        
        return new LatLng(this.reqLoc1.lat() + small, this.reqLoc1.lng() + small);
        
        
        
    };
    
    this.replacePolygon = function(polygonOptions){

        this.polygonOptions = polygonOptions;
        this.polygon.setMap(null);
        this.polygon = new google.maps.Polygon(this.polygonOptions);
        this.polygon.setMap(this.map);
        
    };
    
    this.export = function(){
        
        return JSON.stringify(
        
            {
                loc1: this.loc1,
                loc2: this.loc2
            }
        
        );
        
    };
    
    this.import = function(json){
        
        let locations = JSON.parse(json);
        let loc1 = locations.loc1;
        let loc2 = locations.loc2;
        
        this.reqLoc1 = new LatLng(loc1.lat, loc1.lng);
        this.reqLoc2 = new LatLng(loc2.lat, loc2.lng);
        this.replacePolygon({
            
            path: this.getRectangleDestinations()
            
        });
        
        this.map.setCenter(this.reqLoc1);
        go();
        
    }
    
    this.polygonOptions = {
        
        path: this.getRectangleDestinations()
        
    };
    
    this.polygon = new google.maps.Polygon(this.polygonOptions);
    this.polygon.setMap(map);
    
    this.cycle = 0;
    
    
}



// 27.95995474, 86.89309708
// 28.02816409, 86.96622483

function euclideanDistance(x1, y1, x2, y2){
    
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    
}

function getLowestElevation(elevationMap, numSegX, numSegY){
    
    let min = Infinity;
    for(let x = 0; x < numSegX; x++){
        for(let y = 0; y < numSegY; y++){
            
            min = Math.min(elevationMap[x][y].elevation, min);
            
        }
    }
    
    return min;
    
}

function getHighestElevation(elevationMap, numSegX, numSegY){
    
    let max = -Infinity;
    for(let x = 0; x < numSegX; x++){
        for(let y = 0; y < numSegY; y++){
            
            max = Math.max(elevationMap[x][y].elevation, max);
            
        }
    }
    
    return max;
    
}

function getLowestAndHighestElevations(elevationMap, numSegX, numSegY){
    
    let min = Infinity;
    let max = -Infinity;
    
    for(let x = 0; x < numSegX; x++){
        for(let y = 0; y < numSegY; y++){
            
            min = Math.min(elevationMap[x][y].elevation, min);
            max = Math.max(elevationMap[x][y].elevation, max);
            
        }
    }
    
    return {min: min, max: max};
    
}

function terrainify(terrain, elevationMap, width, height){
    
    const loc1 = elevationMap[0][0].location;
    const loc2 = elevationMap[width][height].location;
    const realDistance = google.maps.geometry.spherical.computeDistanceBetween(loc1, loc2);
    const modelDistance = euclideanDistance(0, 0, width, height);
    //const modelDistance = euclideanDistance(0, 0, sizeX, sizeX);
    
    const oneUnitIsThisManyMeters = realDistance / modelDistance;
    const lowestAndHighestElevations = getLowestAndHighestElevations(elevationMap, width + 1, height + 1);
    //const lowestElevation = getLowestElevation(elevationMap, width + 1, height + 1);
    const lowestElevation = lowestAndHighestElevations.min;
    
    const numSegX = width + 1;
    const numSegY = height + 1;
    
    for(let x = 0; x < numSegX; x++){
        for(let y = 0; y < numSegY; y++){
         
            let index = y * numSegX + x;
            terrain.geometry.vertices[index].z = -(elevationMap[x][y].elevation - lowestElevation) / oneUnitIsThisManyMeters;
            
        }
    }
    
    terrain.geometry.verticesNeedUpdate = true;
    
    console.log("Done!");
    
    return Object.assign(
        
        lowestAndHighestElevations,
        {
            width: google.maps.geometry.spherical.computeDistanceBetween(loc1, elevationMap[width][0].location),
            height: google.maps.geometry.spherical.computeDistanceBetween(loc1, elevationMap[0][height].location),
            latLng: elevationMap[0][0].location
        }
                        
    );
    
}

function constructElevationMap(latlng1, latlng2, samplesX, samplesY){
    
    const lat1 = Math.min(latlng1.lat(), latlng2.lat());
    const lng1 = Math.min(latlng1.lng(), latlng2.lng());
    const lat2 = Math.max(latlng1.lat(), latlng2.lat());
    const lng2 = Math.max(latlng1.lng(), latlng2.lng());
    
    const incrementX = (lat2 - lat1) / samplesX;
    const incrementY = (lng2 - lng1) / samplesY;
    
    let paths = [];
    
    for(let y = lng1; y <= lng2; y += incrementY){
        
        paths.push([new LatLng(lat1, y), new LatLng(lat2, y)]);
        
    }
    
    //let elevationResponses = [];
    let elevationResponses = new Array(paths.length);
    let tempLoad = 0;
    
    for(let y = 0; y < paths.length; y++){
        
        elevator.getElevationAlongPath(
            {
                path: paths[y],
                samples: samplesX
                
            }, function(results, status){
                
                if(status === 'OK'){
                    
                    //elevationResponses.push(results)
                    elevationResponses[y] = results;
                    
                    // replace this system with JS Promises later
                    tempLoad++
                    if(tempLoad === paths.length){
                        
                        selectionManager.replacePolygon({

                            path: selectionManager.getRectangleDestinations(),

                        });
                        
                        selectionManager.loc1 = selectionManager.reqLoc1;
                        selectionManager.loc2 = selectionManager.reqLoc2;
                        
                        let info = terrainify(terrain, elevationResponses, width, height);
                        
                        stats.innerHTML = [
                            
                            '',
                            'Selection Statistics'.bold(),
                            '',
                            'Lowest Elevation: ' + info.min + 'm',
                            'Highest Elevation: ' + info.max + 'm',
                            'Selection Width: ' + info.width + 'm',
                            'Selection Height: ' + info.height + 'm',
                            'Latitude: ' + info.latLng.lat(),
                            'longitude: ' + info.latLng.lng(),
                            
                        ].join('<br>');
                        
                        
                    }
                    
                } else if(status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
                    
                    console.warn('Too many requests to Google Elevation Services. Please try again in about 10 seconds.');
                    
                } else {
                    
                    console.error('Elevation service failed due to: ' + status);
                    
                }
                
            }
        );
        
    }
    
    //return elevationResponses;
 
}

function initTHREE(){
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth * cs, window.innerHeight * cs);
    renderer.domElement.className = "wndw";
    document.body.appendChild(renderer.domElement);
    
    renderer.setClearColor(0x9BCEE1);
    
    camera.position.set(0, 20, 50);
}

function initLighting(){
    
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    
    var pointLight = new THREE.PointLight(0xffffff, 0.65);
    pointLight.position.set(0, 50, 0);
    scene.add(pointLight);
    
}

function initControls(){
    
    controls = new THREE.TrackballControls( camera, renderer.domElement );
    
    controls.maxDistance = 200;
    controls.minDistance = 1;
    
    controls.rotateSpeed = 1.8;
    controls.zoomSpeed = 1.5;
    controls.panSpeed = 0.3;
    
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    
    controls.dynamicDampingFactor = 0.25;
    
    controls.keys = [ 65, 83, 68 ];
    
    //controls.addEventListener( 'change', render );
    rotationSpeedSlider = document.getElementById('rotationSpeedSlider');
    
}

function initTerrain(){
    
    var geometry = new THREE.PlaneGeometry(sizeX, sizeY, width, height);
    geometry.dynamic = true;
    
    var material = new THREE.MeshPhongMaterial( {
        
        color: 0x000000,
        wireframe: true 
    
    } );
    
    terrain = new THREE.Mesh(geometry, material);
    resetOrientation();
    
    scene.add(terrain);
    
}

function initStatistics(){
    
    stats = document.createElement('div');
    document.body.appendChild(stats);
    
}

/*
function modelTerrain(){
    
    elevationMap = constructElevationMap(selectionManager.reqLoc1, selectionManager.reqLoc2, width + 1, height + 1);
    
}*/

function toggleSpinGeometry(value){
    
    spinGeometry = value;
    
}



function frame() {

    now = timestamp();
    dt = now - last;
    accumulation += Math.min(1, dt/1000);
    fps = 1000 / dt;
    
    keyInputs();
    
    while(accumulation >= step){

        update(step);
        
        accumulation -= step;
    }
    
    render();
    
    last = now;
    requestAnimationFrame(frame);
}

function timestamp() {
	
    return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();

}

function keyInputs(){
    
    controls.update();
    
}

function update(step){
    
    if(spinGeometry) terrain.rotation.z += rotationSpeed * step;
    
}

function render(){
    
    renderer.render( scene, camera );
    
}