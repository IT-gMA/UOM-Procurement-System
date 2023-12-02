let UPLOAD_FILE = undefined;
const AJAX_TIMEOUT_DURATION = 864000000;
const TARGET = {
    "vendor_uid": "fce08dd7-8019-ee11-8f6d-002248933ec4",
    "request_uid": "9e9fe519-e68f-ee11-be36-002248117628"
}

function data_url_to_blob(data_url) {
    try {
        var arr = data_url.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (error) {
        console.error('Error converting data URL to Blob:', error);
        return null; // You can return null or handle the error in any other way
    }
}

function convert_b64_str_to_url(mime_type, b64_str){
    return URL.createObjectURL(data_url_to_blob(`data:${mime_type};base64,${b64_str}`));
}

function disable_button(button_dom, disabled=true, replace_markup=null){
    button_dom.attr('disabled', disabled);
    button_dom.css('background', `${disabled ? '#E9E9E9' : '#FAF9F6'}`);
    if (replace_markup != null && typeof replace_markup == 'string'){
        button_dom.empty();
        button_dom.append(replace_markup);
    }
}

function get_base64_contents(b64_str){
    // return a list where:
    // [0]: mimetype
    // [1]: the base64 content string
    const b64_content_sections = b64_str.split(',');
    return [b64_content_sections[0].match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/)[0], b64_content_sections[1]];
}


const convert_to_base64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});


$(document).ready(function(){
    $(document).on('change drop', '#UploadImgInput', function(){
        console.log($(this).attr('id'));
        const files = document.getElementById('UploadImgInput').files;
        UPLOAD_FILE = files[0];
        disable_button($('button[name=upload-product-img]'), [null, undefined].includes(UPLOAD_FILE));
        if(![null, undefined].includes(UPLOAD_FILE)) console.log(UPLOAD_FILE);
    });

    $(document).on('click', 'button[name=upload-product-img]', async function(event){
        if ([null, undefined].includes(UPLOAD_FILE)) return;
        try{
            console.clear();
            const b64_content = get_base64_contents(await convert_to_base64(UPLOAD_FILE));
            console.log('base64 content: ');
            console.log(b64_content[1]);
            console.log(UPLOAD_FILE.name);
            console.log(b64_content[1].length)
            console.log(b64_content[0])
            $.ajax({
                type: 'POST',
                url: 'https://prod-05.australiasoutheast.logic.azure.com:443/workflows/69e09af6a32c4b8ba2fd2fda8ddb5a85/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RGqAfTWZ7L4d5LXvowFFfzzU9CPhilbrcqO2oiHjjWQ',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({
                    'file_name': UPLOAD_FILE.name,
                    'b64_encode': b64_content[1],
                    'size': b64_content[1].length,
                    'mime_type': b64_content[0],
                }),
                complete: function(response, status, xhr){
                    UPLOAD_FILE = undefined;
                    disable_button($('button[name=upload-product-img]'), [null, undefined].includes(UPLOAD_FILE));
                },
                success: function(response, status, xhr){
                    alert('complete');
                },
                error: function(response, status, xhr){
                    alert('Error uploading file');
                },
            });
            
        }catch (error){
            alert('Error reading file');
            console.error(error);
        }
    });


    $(document).on('click', 'button[name=retrieve-file-btn]', function(event){
        console.clear();
        console.log('loading');
        $.ajax({
            type: 'POST',
            url: 'https://prod-27.australiasoutheast.logic.azure.com:443/workflows/117156843d2c4cadb754023277685f19/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wlDtQGXovxjZ359K4XCRHo0HqIqrluBmXHR9hokFn20',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify(TARGET),
            complete: function(response, status, xhr){
            },
            success: function(response, status, xhr){
                console.log(response);
                let _link = document.createElement('a');
                _link.href = URL.createObjectURL(data_url_to_blob(`data:${response.record.crcfc_mimetype};base64,${response.base64_file}`));
                _link.download = `downloaded_${response.record.crcfc_filename}`;
                _link.click();
                // Clean up
                URL.revokeObjectURL(_link.href);
            },
            error: function(response, status, xhr){
                alert('Error retrieving');
            },
        });
    });
});