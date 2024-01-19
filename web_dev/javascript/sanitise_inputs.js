function sanitise_str(input_str){
    if (typeof input_str !== 'string') return input_str;
    return input_str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '')
            .replace(/on\w+=\W*'[^"]*\W'|on\w+=\W*[^"]*\W|on\w+='[^']*'|on\w+="[^"]*"|on\w+=(?:"[^"]*"|'[^']*')/g, '')
            .replace(/style\w+=\W*'[^"]*\W'|style\w+=\W*[^"]*\W|style\w+='[^']*'|style\w+="[^"]*"|style\w+=(?:"[^"]*"|'[^']*')/g, '')
            .replace(/([a-zA-Z:-]+)\s*=\s*['"]([^'"]*)['"]/g, '')
            .replace(`’`, `'`);
}

function sanitise_input_val(input_field){
    if (!input_field.val()) return '';
    return sanitise_str(input_field.val());
}

$(document).on('keyup input change blur', 'input[type="text"], input[type="email"], textarea', function(event){
    $(this).val(sanitise_input_val($(this)));
});

function sanitise_json_obj(json_obj){
    function _format_inner_item(inner_item){
        return typeof inner_item === 'string' ? sanitise_str(inner_item) : inner_item;
    }
    if (Array.isArray(json_obj)) {
        // If the input is an array, recursively format each element
        return json_obj.map(element => {
          if (typeof element === 'object' && element !== null) {
            return sanitise_json_obj(element);
          } else {
            return _format_inner_item(element);
          }
        });
      } else if (typeof json_obj === 'object' && json_obj !== null) {
        // If the input is an object, recursively format each property
        const formatted_obj = {};
        for (const key in json_obj) {
          if (json_obj.hasOwnProperty(key)) {
            const value = json_obj[key];
            formatted_obj[key] = _format_inner_item(value);
          }
        }
        return formatted_obj;
      } else {
        // For non-object values, apply formatting logic
        return _format_inner_item(json_obj);
      }
}


function escape_xml_string(input_str) {
  if (typeof input_str !== 'string') return input_str;
  return input_str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function str_arr_escape_xml(str_arr){
  return str_arr.map(input_str => escape_xml_string(input_str));
}