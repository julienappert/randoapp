function downloadFile(source, dest, successCallback){

	var ret = false;

		//window.requestFileSystem(LocalFileSystem.PERSISTENT, 5 * 1024 * 1024, function (fs) {
		window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {		
		
			fs.root.getFile(dest, { create: true, exclusive: false }, function (fileEntry) {
			
			  var fileTransfer = new FileTransfer();
    		var fileURL = fileEntry.toURL();
    		

    		
				fileTransfer.download(
				    source,
				    fileURL,
				    function (entry) {
				        successCallback(entry);       
				    },
				    function (error) {

				        console.log("download error source " + error.source);
				        console.log("download error target " + error.target);
				        console.log("upload error code" + error.code);
				    }
				);    		
    		

			}, onErrorCreateFile);

	}, onErrorLoadFs);
	
	return ret;

}

function readFile(fileEntry) {

    fileEntry.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function() {
            console.log("Successful file read: " + this.result);
        };

        reader.readAsText(file);

    }, onErrorReadFile);
}

function onErrorReadFile(error){
	console.log('error read file');
	console.log(error);
}

function onErrorCreateFile(error){
	console.log('error create file');
	console.log(error);
}

function onErrorLoadFs(error){
	console.log('error load FS');
	console.log(error);
}
