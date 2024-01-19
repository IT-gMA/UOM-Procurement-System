const AJAX_TIMEOUT_DURATION = 864000000;
const MAX_IMG_SIZE_KB = 50000;
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');

const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');
const APPLY_PRODUCT_INFO_CHANGES_BTN = $('button[name=apply-order-info-changes-btn]');
const APPLY_INSERT_PRODUCT_BTN = $('button[name=apply-new-product-insertion-btn]');
const LOAD_MORE_PRODUCTS_BTN = $('button[name=load-more-orders-btn]');

const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PROGRESS_BAR_DOM = $('div[name=request-loader-progress-bar]');
const PRODUCT_INFO_TABLE = $('table[name=product-info-table]');
const INSERTED_PRODUCT_INFO_TABLE = $('table[name=inserted-product-info-table]');

const ACTIVE_STATUS_FILTER_DROPDOWN = $('ul[name=active-status-sort-opts]');
const CATEGORY_FILTER_DROPDOWN = $('ul[name=category-filter-opts]');
const SUBCATEGORY_FILTER_DROPDOWN = $('ul[name=sub-category-filter-opts]');
const BRAND_FILTER_DROPDOWN = $('ul[name=brand-filter-opts]');

let product_filter_checkbox_func_names = '';
const FILTER_DROPDOWNS = [CATEGORY_FILTER_DROPDOWN, SUBCATEGORY_FILTER_DROPDOWN, BRAND_FILTER_DROPDOWN, ACTIVE_STATUS_FILTER_DROPDOWN];
FILTER_DROPDOWNS.forEach((dropdown, idx) => {
    product_filter_checkbox_func_names += `input[name=${dropdown.attr('name')}-checkbox]${idx < FILTER_DROPDOWNS.length - 1 ? ', ' : ''}`;
});

let vendor_filter_options = [];
let brand_filter_options = [{'value': -1, 'label': 'No Brand'}];
let category_filter_options = [];
let subcategory_filter_options = [];
let customer_filter_options = [];

let CATEGORIES = [];
let SUB_CATEGORIES = [];
let BRANDS = [];
let FORMATTED_UOM_PRODUCTS = [];
let INSERTED_UOM_PRODUCT = undefined;
const DISABLED_ELEM_CLASS = 'disabled-element';
const ERR_INPUT_INDICATOR_CLASS = 'red-outline';

const MAX_RECORD_NUM = 100;
let CURR_PAGE_NUM = 1;
const ORDER_UNIT_CHOICES = [
    { "value": 0, "label": 'N/A'},
    { "value": 1, "label": "CTN" },
    { "value": 2, "label": "each" },
    { "value": 3, "label": "kg" },
    { "value": 4, "label": "Punnets" },
    { "value": 5, "label": "Bunch" },
    { "value": 6, "label": "Bag" },
    { "value": 7, "label": "Tray" },
    { "value": 8, "label": "PKT" },
    { "value": 9, "label": "TUB" },
    { "value": 10, "label": "PAIL" },
    { "value": 12, "label": 1 },
    { "value": 13, "label": "BX" },
    { "value": 14, "label": "PK" },
    { "value": 15, "label": "RO" },
    { "value": 16, "label": "25/125GM" },
    { "value": 17, "label": "5/50GM" },
    { "value": 18, "label": "20/200GM" },
    { "value": 19, "label": "30/180GM" },
    { "value": 20, "label": "12x130" },
    { "value": 21, "label": "12x80" },
    { "value": 22, "label": "PET" },
    { "value": 23, "label": "CAN" },
    { "value": 24, "label": "Btl" },
    { "value": 25, "label": "PR" }
];
let BULK_ORDER_UNIT_CHOICES = [...ORDER_UNIT_CHOICES];  
BULK_ORDER_UNIT_CHOICES.unshift({value: -1, label: 'None'});
const PRODUCT_CARD_PREVIEW_MODAL= $('#ProductCardPreviewModal');

//Product Image Upload Resources
const UPLOAD_IMG_MODAL = $('#ProductImgUploadModal');
const UPDATE_PRODUCT_IMG_BTN = $('.update-product-img-btn');
const UPLOAD_PRODUCT_IMG_BTN = $('button[name=upload-product-img]');
const REMOVE_PRODUCT_IMG_BTN = $('button[name=remove-product-img]');
const UPLOAD_IMG_INPUT = $('input[name=upload-img-input]');
const PRODUCT_IMG_CONTAINER = $('div[name=product-thumbnail-img-preview-container]');
let IS_UPDATING_IMG = false;


/*Util Functions*/
function clean_white_space(input_string, all=true){
    return input_string.replace(/\s+/g, all ? '' : ' ');
}

function trim_and_to_regex(input_str, clean_all=true){
    return clean_white_space(input_str.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, ''), clean_all);
}

function verify_number_input(num_input, is_int=true, min_value=Number.NEGATIVE_INFINITY, max_value=Number.POSITIVE_INFINITY){
    // Format an Input text Field's value to integers and verify whether the resulting integer
    // is within the min max range. If the value is out of range assign it with min or max value
    let valid_input = true;
    let curr_value = num_input.val();
    if (!num_input.val() || is_whitespace(curr_value)) return valid_input;
    curr_value = is_int ? parseInt(curr_value.replace(/\D/g, '')) : parseFloat(curr_value.replace(/[^-?0-9.]/g, ''));
    if (isNaN(curr_value)){
        num_input.val(null);
        return false;
    }
    if (curr_value < min_value) curr_value = min_value;
    if (curr_value > max_value) curr_value = max_value;
    num_input.val(is_int ? curr_value : parseFloat(curr_value).toFixed(2));
    num_input.val(curr_value);
    return curr_value >= min_value;
}

function is_whitespace(str) {
    //if ([undefined, null].includes(str) || typeof str != 'string') return true;
    return !str.trim().length;
}

function capitalise_str(input_str){
    return input_str.charAt(0).toUpperCase() + input_str.slice(1);
}

function get_category_relative_path(category_uid){
    return `${window.location.origin}/view-products?category-uid=${category_uid}`;
}

function get_sum_num_arr(num_arr, round_to=-1, base=0){
    const sum = num_arr.reduce(function (accumulator, curr_num) {
        return accumulator + curr_num;
    }, base);
    return round_to >= 0 ? parseFloat(sum).toFixed(round_to) : sum;
}

function get_min_max_from_dt_arr(dt_arr){
    return {'min': new Date(Math.min(...dt_arr.map(date => new Date(date).getTime()))), 'max': new Date(Math.max(...dt_arr.map(date => new Date(date).getTime())))};
}

function is_within_datetime_range(input_date, min_date, max_date){
    return new Date(`${min_date}`) <= new Date(`${input_date}`) && new Date(`${input_date}`) <= new Date(`${max_date}`);
}


function get_daterange_input_val(dt_input){
    const min_date = parse_dt_str_and_obj(dt_input.attr('data-start'), false);
    let max_date = parse_dt_str_and_obj(dt_input.attr('data-end'), false);
    max_date = new Date(max_date.setHours(max_date.getHours() + 23, max_date.getMinutes() + 59));
    return {'min_date': min_date, 'max_date': max_date};
}

function flatten_arr(arr) {
    return [].concat(...arr.map(item => Array.isArray(item) ? flatten_arr(item) : item));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function to_datetime(datetime_str, smallest=true){
    const datetime = new Date(datetime_str);
    if (isNaN(datetime)) return new Date(smallest ? "0000-01-01T00:00:00" : "9999-12-31T23:59:59");
    return datetime;
}

function is_json_data_empty(data){
    if ([null, undefined].includes(data)) return true;
    if (typeof data == 'string') return is_whitespace(data);
    return false;
}

function group_arr_of_objs(arr, key_name){
    const grouped_data = arr.reduce((result, item) => {
        const key = item[`${key_name}`];
        
        // Check if there is already an array for this key, if not, create one
        if (!result[key]) {
          result[key] = [];
        }
        
        // Push the item into the array corresponding to its key
        result[key].push(item);
        
        return result;
    }, {});
    return Object.keys(grouped_data).map((key) => {
        return {
          key: key,
          grouped_objects: grouped_data[key],
        };
    });
}

function hide_elems_on_load(complete=false){
    $('div[name=progress-resource-loader-container]').toggle(false);
    $('.content-section').toggle(complete);
    $('.resource-loader-section').toggle(!complete);
    $('.resource-loader-section').toggle(!complete);
}

function disable_button(button_dom, disabled=true, replace_markup=null){
    button_dom.attr('disabled', disabled);
    button_dom.css('background', `${disabled ? '#E9E9E9' : '#FAF9F6'}`);
    if (replace_markup != null && typeof replace_markup == 'string'){
        button_dom.empty();
        button_dom.append(replace_markup);
    }
}

function disable_insert_new_product_btn(){
    disable_button(APPLY_INSERT_PRODUCT_BTN, !INSERTED_PRODUCT_INFO_TABLE.find('input[name=product-name-input-field]').val() || is_whitespace(INSERTED_PRODUCT_INFO_TABLE.find('input[name=product-name-input-field]').val()) || !INSERTED_PRODUCT_INFO_TABLE.find('input[name=product-min-quantity-input-field]').val() || is_whitespace(INSERTED_PRODUCT_INFO_TABLE.find('input[name=product-min-quantity-input-field]').val()) || !INSERTED_PRODUCT_INFO_TABLE.find('input[name=unit-size-input-field]').val() || is_whitespace(INSERTED_PRODUCT_INFO_TABLE.find('input[name=unit-size-input-field]').val()));
}

function disable_filter_elements(disabled=true, elem_markup=undefined){
    const target_elems = elem_markup ?? $('.order-attr-filter-opt-container');
    disabled ? target_elems.addClass(DISABLED_ELEM_CLASS) : target_elems.removeClass(DISABLED_ELEM_CLASS);
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

function convert_b64_img_str_to_url(mime_type, b64_str){
    return URL.createObjectURL(data_url_to_blob(`data:${mime_type};base64,${b64_str}`));
}

function is_b64_str_longer_than_allowed(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        console.log(Math.abs(event.target.result.split(',')[1].length));
        callback(Math.abs(event.target.result.split(',')[1].length) > 1048576);
    };
    reader.readAsDataURL(file);
}

function covert_product_b64_img_to_url(mime_type, b64_str){
    if (is_json_data_empty(mime_type) || is_json_data_empty(b64_str)
    || is_whitespace(mime_type) || is_whitespace(b64_str)) return PLACE_HOLDER_IMG_URL;
    try{return convert_b64_img_str_to_url(mime_type, b64_str);} catch(error){return PLACE_HOLDER_IMG_URL;}
}


const convert_to_base64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function get_base64_contents(b64_str){
    // return a list where:
    // [0]: mimetype
    // [1]: the base64 content string
    const b64_content_sections = b64_str.split(',');
    return [b64_content_sections[0].match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/)[0], b64_content_sections[1]];
}

function resize_img(file, max_size_kb, call_back_func) {
    let img = new Image();
    img.onload = function() {
        let width = img.width;
        let height = img.height;
        let scale_factor = 1;
        
        if (file.size > max_size_kb) {
            scale_factor = Math.sqrt(max_size_kb / file.size);
            width *= scale_factor;
            height *= scale_factor;
        }
        
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas content to data URL
        let mime_type = file.type;
        let data_url = canvas.toDataURL(mime_type);
        
        // Convert data URL to Blob
        let resized_blob = data_url_to_blob(data_url);
        
        // Create a new File object
        let resized_file = new File([resized_blob], file.name, { type: mime_type });
        
        call_back_func(resized_file);
    };
    img.onerror = function() {
        console.error('Error loading image:', img.src);
    };
    img.src = URL.createObjectURL(file);
}

function get_xml_filter_queries(){
    const searched_products = [undefined, null].includes(PRODUCT_SEARCH_TEXT_FIELD.val()) ? '' : PRODUCT_SEARCH_TEXT_FIELD.val();
    let filtered_brand_opts =  get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`);
    if (filtered_brand_opts.indexOf('-1') !== -1) filtered_brand_opts = filtered_brand_opts.map(function(item) {return item === '-1' ? null : item;});// Replace '-1' with null
    const filtered_category_opts =  get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_subcategory_opts =  get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
    
    const filtered_category_xml_query = `
    <condition attribute="prg_category" operator="in">${filtered_category_opts.map(data => `<value>${data}</value>`).join('\n')}</condition>`;
    const filtered_subcategory_xml_query = `
    <condition attribute="prg_subcategory" operator="in">${filtered_subcategory_opts.map(data => `<value>${data}</value>`).join('\n')}</condition>`;
    const filtered_product_name_xml_query = `<condition attribute="prg_name_trimmed" operator="like" value="%${clean_white_space(escape_xml_string(searched_products).trim().toLowerCase())}%" />`;

    const filtered_brand_xml_query = filtered_brand_opts.includes(null) ? `
    <filter type="or">
        <condition attribute="prg_brand" operator="in">${filtered_brand_opts.filter(data => data !== null).map(data => `<value>${data}</value>`).join('\n')}</condition><condition attribute="prg_brand" operator="null" />
    </filter>` :
    `<filter type="and">
        <condition attribute="prg_brand" operator="in">${filtered_brand_opts.map(data => `<value>${data}</value>`).join('\n')}</condition>
    </filter>`;
    const selected_active_status_filter_opts = get_selected_filter_values(`${ACTIVE_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_active_status_xml_query = selected_active_status_filter_opts.length >= 2 ? '' : 
                                            `<condition attribute="statecode" operator="in">${selected_active_status_filter_opts.map(data => `<value>${data}</value>`)}</condition>`;

    return {
        'filtered_product_name_xml_query': filtered_product_name_xml_query,
        'filtered_brand_xml_query': filtered_brand_xml_query,
        'filtered_subcategory_xml_query': filtered_subcategory_xml_query,
        'filtered_category_xml_query': filtered_category_xml_query,
        'filtered_active_status_xml_query': filtered_active_status_xml_query,
    }
}

function get_xml_sort_queries(){
    if ($(document).find('input[name=xml-sort-option-radio-checkbox][type="radio"]:checked').length < 1) return '<order attribute="prg_name_trimmed" descending="false" />';
    return `<order attribute="${$(document).find('input[name=xml-sort-option-radio-checkbox][type="radio"]:checked').attr('data-attrname')}" descending="${$(document).find('input[name=xml-sort-option-radio-checkbox][type="radio"]:checked').attr('data-isdesc')}" />`;
}


function is_product_table_row_from_insertion(input_elem){
    return input_elem.closest('tr').closest('table').attr('name') === INSERTED_PRODUCT_INFO_TABLE.attr('name');
}
function render_product_card_preview(product, parent_container){
    parent_container.append(`
        <div class='card-container product-card' name='product-card-container'><p id='product-remark-container' hidden>${product.remark}</p>
            <div class='thumbnail-img-container'><img src='${product.thumbnail_img}'/></div>
            <div class='product-description-container'><div class='text-container'><div class='desc-txt_bx'><span style='font-weight: bold;'>${!is_whitespace(product.product_name) ? product.product_name : '<Product Name>'}</span></div><span class="material-symbols-rounded product-info-btn" name='product-info-btn'>info</span></div>
                <div style='min-height: 4em;'><hr><h6><span style='font-weight: 600;'>${product.category_name}</span><br><span style='font-weight: 500; opacity: ${product.subcategory_uid === 'f0d85952-7c19-ee11-8f6c-000d3a6ac9e1' ? '0' : '1'}'>${product.subcategory_name}</span><br></h6></div><p>$10.00</p><br>${product.order_size_desc_txt}
            </div>
            <div class='quantity-control-container'>
                <i class="fa-solid fa-circle-plus product-quantity-control-btn" name='product-quantity-control-btn' data-add='1'></i>
                <input class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${product.min_quantity}' name="product-quantity-input-field"/>
                <i class="fa-solid fa-circle-minus product-quantity-control-btn" name='product-quantity-control-btn' data-add='0'></i>
            </div><div style='display: flex; align-items: center; justify-content: center; position: relative; width: 100%; margin-top: 1.25em; margin-bottom: .45em;'><button type='button' class='btn btn-primary add-to-cart-btn' name='add-to-cart-btn' disabled>Add to Cart</button></div></div>`);
}
//End of Util functions


function _format_vendor_stock_remained(stock_on_hand, stock_ordered){
    const stock_remained = stock_on_hand - stock_ordered;
    return stock_remained >= 0 ? `${stock_remained} remained` : `${Math.abs(stock_remained)} required`;
}


function format_json_product(json_product, for_insert=false){
    const default_category = CATEGORIES[0];
    const default_order_unit = ORDER_UNIT_CHOICES[0];
    return sanitise_json_obj({
        'product_uid': for_insert ? 'new-product1' : json_product.prg_uomprocurementserviceproductsid,
        'product_barcode': for_insert ? '' : is_json_data_empty(json_product.prg_unitbarcodes) ? '' : json_product.prg_unitbarcodes,
        'product_name': for_insert ? '' : json_product.prg_name,
        'product_trimmed_name': for_insert ? '' : clean_white_space(json_product.prg_name.trim().toLowerCase()),
        'thumbnail_img': covert_product_b64_img_to_url(json_product.crcfc_img_content_mime_type, json_product.crcfc_img_content),
        'img_content': for_insert || is_json_data_empty(json_product.crcfc_img_content) || is_whitespace(json_product.crcfc_img_content) ? undefined : json_product.crcfc_img_content,
        'img_content_mime_type': for_insert || is_json_data_empty(json_product.crcfc_img_content_mime_type) || is_whitespace(json_product.crcfc_img_content_mime_type) ? undefined : json_product.crcfc_img_content_mime_type,
        'img_file': undefined,
        'remark': for_insert ? '' : json_product.prg_remarks ?? '',
        'min_quantity': for_insert ? 1 : json_product.prg_minorderquantity,
        'order_unit_code': for_insert ? default_order_unit.value : json_product.prg_orderunit,
        'order_unit_name': for_insert ? default_order_unit.label : json_product['prg_orderunit@OData.Community.Display.V1.FormattedValue'],
        'product_size': is_json_data_empty(json_product.prg_productsize) ? '' : json_product.prg_productsize,
        'unit_size': for_insert ? 1 :json_product.prg_unitsize,
        'category_uid': for_insert ? default_category.value : json_product['_prg_category_value'],
        'category_name': for_insert ? default_category.label : json_product['_prg_category_value@OData.Community.Display.V1.FormattedValue'],
        'subcategory_uid': for_insert ? 'f0d85952-7c19-ee11-8f6c-000d3a6ac9e1' : json_product['_prg_subcategory_value'],
        'subcategory_name': for_insert ? 'None' : json_product['_prg_subcategory_value@OData.Community.Display.V1.FormattedValue'],
        'brand_code': is_json_data_empty(json_product['_prg_brand_value']) || for_insert ? -1 : json_product['_prg_brand_value'],
        'brand_name': is_json_data_empty(json_product['_prg_brand_value']) || for_insert ? 'No Brand' : json_product['_prg_brand_value@OData.Community.Display.V1.FormattedValue'],
        'createdon_str': for_insert ? format_dt(new Date()) : format_dt(new Date(json_product.createdon)),
        'createdon': for_insert ? `${new Date()}` : json_product.createdon,
        'modifiedon_str': for_insert ? format_dt(new Date()) : format_dt(new Date(json_product.modifiedon)),
        'modifiedon': for_insert ? `${new Date()}` : json_product.modifiedon,
        'bulk_order_unit_code': is_json_data_empty(json_product.prg_bulkorder) || for_insert ? -1 : json_product.prg_bulkorder,
        'bulk_order_unit_name': is_json_data_empty(json_product.prg_bulkorder) || for_insert ? 'None' : json_product['prg_bulkorder@OData.Community.Display.V1.FormattedValue'],
        'is_active': for_insert ? true : json_product.statecode === 0,
    });
}

function remove_input_red_color(input_dom){
    input_dom.hasClass(ERR_INPUT_INDICATOR_CLASS) ? input_dom.removeClass(ERR_INPUT_INDICATOR_CLASS) : null;
}


function format_dt(datetime){
    return datetime.getHours().toString().padStart(2, '0') + ':' +
    datetime.getMinutes().toString().padStart(2, '0') + ' ' +
    datetime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function get_week_of_year(date) {
    // Copy the date to avoid modifying the original object
    const copied_date = new Date(date);
  
    // Find the first day of the year
    copied_date.setMonth(0, 1);
  
    // Get the day of the week for the first day of the year
    const first_day_of_week = copied_date.getDay();
  
    // Move the first day of the week to Sunday (0), if it's not already
    copied_date.setDate(copied_date.getDate() - first_day_of_week);
  
    // Calculate the week number by counting the number of Sundays (start of the weeks)
    let week_idx = 0;
    while (copied_date < date) {
      copied_date.setDate(copied_date.getDate() + 7);
      week_idx++;
    }
  
    return week_idx;
}

function date_to_week_str(date) {
    date = new Date(`${date}`);
    return `Week ${get_week_of_year(date)} - ${date.getFullYear()}`;
}

function format_dt_to_xml_query_dt(input_dt) {
    try {
        // Split the input date into day, month, and year components
        const dateComponents = input_dt.split('/');

        // Ensure that we have exactly three components
        if (dateComponents.length !== 3) {
            throw new Error('Invalid date format');
        }

        // Rearrange the components to the "MM/DD/YYYY" format
        const month = dateComponents[1];
        const day = dateComponents[0];
        const year = dateComponents[2];

        // Create a new date string in "MM/DD/YYYY" format
        const convertedDate = `${year}-${month}-${day}`;

        return convertedDate;
    } catch (error) {
        // Handle the error, e.g., by returning an error message or throwing the error
        return undefined;
    }
}

function set_dt_to_week_begin_end(datetime, end=false){
    const day_of_week = datetime.getDay();
    let num_days_from_the_end = day_of_week === 0 ? 6 : day_of_week - 1;
    if (end) num_days_from_the_end = day_of_week === 0 ? 0 : 7 - day_of_week;
    if (!end){
        datetime.setDate(datetime.getDate() - num_days_from_the_end);
        datetime.setHours(0, 0, 0, 0); // Set the time to 00:00:00
    }else{
        datetime.setDate(datetime.getDate() + num_days_from_the_end);
        datetime.setHours(23, 59, 59, 999); // Set the time to 23:59:59.999
    }
}

function get_weeks_in_range(min_date, max_date) {
    const week_in_range = [];

    let end_date = new Date(max_date);
    let curr_date = new Date(min_date);
    set_dt_to_week_begin_end(end_date, true);
    set_dt_to_week_begin_end(curr_date);
  
    while (curr_date <= end_date) {
      week_in_range.push(date_to_week_str(curr_date));
      // Move to the next week
      curr_date.setDate(curr_date.getDate() + 7);
    }
    return week_in_range;
}

function parse_dt_str_and_obj(dt_str_obj, to_string=false){
    if (to_string){
        const day = dt_str_obj.getDate();
        const month = dt_str_obj.getMonth() + 1; // Month is zero-based, so add 1
        const year = dt_str_obj.getFullYear();

        // Pad single-digit day and month with leading zero if necessary
        const formattedDay = day.toString().padStart(2, '0');
        const formattedMonth = month.toString().padStart(2, '0');

        return `${formattedDay}/${formattedMonth}/${year}`;
    }
    const [formattedDay, formattedMonth, year] = dt_str_obj.split('/');
    const month = parseInt(formattedMonth, 10) - 1; // Subtract 1 to convert back to zero-based
    const day = parseInt(formattedDay, 10);

    return new Date(year, month, day);
}

function get_product_info_markup(info_name, info_content, is_last=false){
    return `<h6><span style='font-weight: bold;'>${info_name}: </span>${info_content}</h6>${is_last ? '' : '<br>'}`;
}


function render_loading_progress_bar(curr_progress=0){
    curr_progress = curr_progress < 0 ? 0 : curr_progress;
    curr_progress = curr_progress > 100 ? 100 : curr_progress;

    PROGRESS_BAR_DOM.attr('aria-valuenow', curr_progress);
    PROGRESS_BAR_DOM.css('width', `${curr_progress}%`);
}
/*End of Util functions*/


function render_filter_options(dropdown_container, filter_opts, sort_by_label=false){
    if (sort_by_label) filter_opts = filter_opts.sort((a, b) => a.label.localeCompare(b.label));
    filter_opts.forEach(filter_opt => {
        dropdown_container.append(`
        <div class='dropdown-item  order-attr-filter-opt-container'>
            <input class='form-check-input filter-opt-radio' type='checkbox' name='${dropdown_container.attr('name')}-checkbox' data-label='${DOMPurify.sanitize(filter_opt.label)}' data-value='${filter_opt.value}' data-parentul='${dropdown_container.attr('name')}'>
            <label class='form-check-label'>${DOMPurify.sanitize(filter_opt.label)}</label>
        </div>
        `);
    });
}

function make_choice_selection_radio_dropdown(target_choices, default_choice_label, default_choice_value, affected_value, affected_label, container_name, item_uid, long_container=true){
    return `<div class='opt-selection-btn${long_container ? ' long-selection-btn' : ''}' id='sort-container' name='${container_name}' data-affectedvalue='${affected_value}' data-affectedlabel='${affected_label}'>
                <a class='nav-link' role='button' data-bs-toggle='dropdown' aria-expanded='false'>${default_choice_label}</a>
                    <ul class='dropdown-menu dropdown-menu-end' aria-labelledby='navbarDropdown' onclick='event.stopPropagation()' style='overflow: scroll; max-height: 20em;'>
                        ${target_choices.map((data, i) => `<div class='dropdown-item' name='${container_name}-checkbox-container'>
                                                                <input class='form-check-input filter-opt-radio attr-selection-opt-radio-checkbox' type='radio' data-value='${data.value}' data-label='${DOMPurify.sanitize(data.label)}' name='${item_uid}-${container_name}-checkbox'${default_choice_value === data.value ? ' checked' : ''}>
                                                                <label class='form-check-label'>${DOMPurify.sanitize(data.label)}</label>
                                                            </div> `).join('\n')}</ul></div>`;
}

function make_product_tr_markup(formatted_product, target_table){
    const order_unit_choice_dropdown = make_choice_selection_radio_dropdown(ORDER_UNIT_CHOICES, formatted_product.order_unit_name, formatted_product.order_unit_code, 'data-orderunitcode', 'data-orderunitname','order-unit-choice-selection', formatted_product.product_uid);
    const bulk_unit_choice_dropdown = make_choice_selection_radio_dropdown(BULK_ORDER_UNIT_CHOICES, formatted_product.bulk_order_unit_name, formatted_product.bulk_order_unit_code, 'data-bulkorderunitcode', 'data-bulkorderunitname','bulk-unit-choice-selection', formatted_product.product_uid);
    const category_choice_dropdown = make_choice_selection_radio_dropdown(CATEGORIES, formatted_product.category_name, formatted_product.category_uid, 'data-categoryuid', 'data-categoryname','category-choice-selection', formatted_product.product_uid);
    const sub_category_choice_dropdown = make_choice_selection_radio_dropdown(SUB_CATEGORIES, formatted_product.subcategory_name, formatted_product.subcategory_uid, 'data-subcategoryuid', 'data-subcategoryname', 'sub-category-choice-selection', formatted_product.product_uid);
    const brand_choice_dropdown = make_choice_selection_radio_dropdown(BRANDS, formatted_product.brand_name, formatted_product.brand_code, 'data-brandcode', 'data-brandname', 'brand-choice-selection', formatted_product.product_uid);

    return `<tr name='${target_table.attr('name')}-row' class='data-row'
                data-productuid='${formatted_product.product_uid}' data-productname='${formatted_product.product_name}' data-productnametrimmed='${formatted_product.product_trimmed_name}'
                data-barcode='${formatted_product.product_barcode}' data-brandname='${formatted_product.brand_name}' data-brandcode='${formatted_product.brand_code}'
                data-orderunitname='${formatted_product.order_unit_name}' data-orderunitcode='${formatted_product.order_unit_code}'
                data-bulkorderunitname='${formatted_product.bulk_order_unit_name}' data-bulkorderunitcode='${formatted_product.bulk_order_unit_code}'
                data-unitsize='${formatted_product.unit_size}' data-productsize='${formatted_product.product_size}'
                data-categoryname='${formatted_product.category_name}' data-categoryuid='${formatted_product.category_uid}'
                data-subcategoryname='${formatted_product.subcategory_name}' data-subcategoryuid='${formatted_product.subcategory_uid}'
                data-minquantity='${formatted_product.min_quantity}' data-remark='${formatted_product.remark}'
                data-createdon='${formatted_product.createdon}' data-createdonstr='${formatted_product.createdon_str}'>
                data-modifiedon='${formatted_product.modifiedon}' data-modifiedonstr='${formatted_product.modifiedon_str}'>
        <td name='product-card-preview-btn'><div class='image-container'><img src='https://i.ibb.co/vdPXt16/uom-product-card-preview-btn-icon.webp'></div></td>
        <td><div class='image-container' name='product-info-btn'><img src='${formatted_product.thumbnail_img}'/></div></td>
        <td><input maxlength='800' class='long-txt-edit-field border-effect' type='text' placeholder='${formatted_product.product_name}' name="product-name-input-field" value='${formatted_product.product_name}'/></td>
        <td>${category_choice_dropdown}</td>
        <td>${sub_category_choice_dropdown}</td>
        <td>${brand_choice_dropdown}</td>
        <td><input maxlength='8' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${formatted_product.min_quantity}' name="product-min-quantity-input-field" value='${formatted_product.min_quantity}' data-min='1' data-max='10000'/></td>
        <td><input maxlength='8' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${formatted_product.unit_size}' name="unit-size-input-field" value='${formatted_product.unit_size}' data-min='1' data-max='10000'/></td>
        <td><input maxlength='1000' class='long-txt-edit-field border-effect' type='text' placeholder='${formatted_product.product_size}' name="product-size-input-field" value='${formatted_product.product_size}'/></td>
        <td>${order_unit_choice_dropdown}</td>
        <td>${bulk_unit_choice_dropdown}</td>
        <td><input maxlength='1000' class='long-txt-edit-field border-effect' type='text' placeholder='${formatted_product.product_barcode}' name="bar-code-input-field" value='${formatted_product.product_barcode}'/></td>
        <td><textarea maxlength='1000' class='long-txt-edit-field border-effect area-txt-edit-field' type='text' placeholder='${formatted_product.remark}' name="product-remark-input-field">${formatted_product.remark}</textarea></td>
        <td><div class="form-check form-switch"><input class="form-check-input item-active-state-switch" type="checkbox" name='product-active-state-switch' ${formatted_product.is_active ? 'checked' : ''}></div></td>
        <td>${formatted_product.createdon_str}</td>
        <td>${formatted_product.modifiedon_str}</td>
    </tr>`;
}

function render_inserted_product_table(){
    INSERTED_UOM_PRODUCT = format_json_product({}, true);
    INSERTED_PRODUCT_INFO_TABLE.find('tbody').empty();
    INSERTED_PRODUCT_INFO_TABLE.find('tbody').append(make_product_tr_markup(INSERTED_UOM_PRODUCT, INSERTED_PRODUCT_INFO_TABLE));
}

function render_body_content(){
    $.ajax({
        type: 'POST',
        url: 'https://prod-25.australiasoutheast.logic.azure.com:443/workflows/7d533adaeedd4907992be340dc1ac7df/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-nsGiU3X0c4b1xumg1BW_mupBjC7HvBdDaDVVcUysOU',
        contentType: 'application/json',
        accept: 'application/json;odata=verbose',
        timeout: AJAX_TIMEOUT_DURATION,
        complete: function(response, status, xhr){
            hide_elems_on_load(true);
            $('.content-section.order-history-content-section').toggle(false);
            $('section[name=inserted-product-info-section]').toggle(true);
            
        }, success: function(response, status, xhr){
            BRANDS.push({'label': 'No Brand', 'value': -1})
            sanitise_json_obj(response.brands).forEach(brand => {
                BRANDS.push({'label': brand.prg_name, 'value': brand.prg_ggorderbrandid});
            });

            sanitise_json_obj(response.sub_categories).forEach(sub_category => {
                SUB_CATEGORIES.push({'label': sub_category.prg_name, 'value': sub_category.prg_uomprocurementservicesubcatgeoryid});
            });

            sanitise_json_obj(response.categories).forEach(category => {
                CATEGORIES.push({'label': category.prg_name, 'value': category.prg_uomprocurementservicecategoriesid});
            });
            render_filter_options(BRAND_FILTER_DROPDOWN, BRANDS);
            render_filter_options(CATEGORY_FILTER_DROPDOWN, CATEGORIES);
            render_filter_options(SUBCATEGORY_FILTER_DROPDOWN, SUB_CATEGORIES);
            render_filter_options(ACTIVE_STATUS_FILTER_DROPDOWN, [{'label': 'Active', 'value': 0}, {'label': 'Inactive', 'value': 1}]);

            $('section[name=inserted-product-info-section]').toggle(true);
            render_inserted_product_table();

        }, error: function(response, status, xhr){
            alert('Failed to load data at this time');
        }
    });
}


function get_selected_filter_values(checkbox_name, to_int=false){
    let selected_values = [];
    let all_values = [];
    $(`input[name=${checkbox_name}]`).each(function(){
        let _value_here = $(this).attr('data-value');
        if (to_int) _value_here = parseInt(_value_here);
        all_values.push(_value_here);
        if($(this).is(':checked') || $(this).prop('checked')) selected_values.push(_value_here);
    });
    if (selected_values.length < 1) return all_values;
    return selected_values;
}

function verify_valid_info_fields(parent_table_name){
    let is_valid = true;
    function _invalidate_input(input_field){
        is_valid = false;
        input_field.addClass(ERR_INPUT_INDICATOR_CLASS);
    }
    function _revalidate_input(input_field){
        if (input_field.hasClass(ERR_INPUT_INDICATOR_CLASS)) input_field.removeClass(ERR_INPUT_INDICATOR_CLASS);
    }

    $(document).find(`tr[name=${parent_table_name}-row]`).each(function(){
        const parent_tr = $(this);
        // Check for null value
        parent_tr.find('input[name=unit-size-input-field], input[name=unit-size-input-field], input[name=product-name-input-field]').each(function(){
            if (!$(this).val() || is_whitespace($(this).val())) _invalidate_input($(this));
        });

        // Verify numeric input values
        parent_tr.find('input[name=unit-size-input-field], input[name=unit-size-input-field]').each(function(){
            let curr_value = $(this).val();
            const is_int = ['product-min-quantity-input-field', 'unit-size-input-field'].includes($(this).attr('name'));
            curr_value = is_int ? parseInt(curr_value.replace(/\D/g, '')) : parseFloat(curr_value.replace(/[^-?0-9.]/g, ''));
            if (isNaN(curr_value)) _invalidate_input($(this));
            
            const max = is_int ? parseInt($(this).attr('data-max')) : parseFloat($(this).attr('data-max'));
            const min =  is_int ? parseInt($(this).attr('data-min')) : parseFloat($(this).attr('data-min'));
    
            if (curr_value < min || curr_value > max) _invalidate_input($(this));
        });
        if (!is_valid) return false;
    });

    return is_valid;
}


$(document).ready(function(){
    hide_elems_on_load();
    render_body_content();

    $(document).on('click', '.applyBtn.btn.btn-sm.btn-primary', function(e){
        disable_button(APPLY_FILTER_BTN, false);
        disable_button(CLEAR_FILTER_BTN, false);
    });

    // Product Preview Function
    $(document).on('click', 'td[name=product-card-preview-btn]', function(event){
        PRODUCT_CARD_PREVIEW_MODAL.find('.modal-dialog').empty();
        const parent_tr = $(this).closest('tr');
        const preview_product_content = !is_product_table_row_from_insertion($(this)) ? {...FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid === parent_tr.attr('data-productuid'))[0]} : {...INSERTED_UOM_PRODUCT};
        preview_product_content.category_name = parent_tr.find('div[name=category-choice-selection]').find('.nav-link').text();
        preview_product_content.subcategory_uid = parent_tr.attr('data-subcategoryuid');
        preview_product_content.subcategory_name = parent_tr.find('div[name=sub-category-choice-selection]').find('.nav-link').text();
        preview_product_content.min_quantity = !parent_tr.find('input[name=product-min-quantity-input-field]').val() || is_whitespace(parent_tr.find('input[name=product-min-quantity-input-field]').val()) ? parent_tr.find('input[name=product-min-quantity-input-field]').attr('placeholder') : parent_tr.find('input[name=product-min-quantity-input-field]').val();
        preview_product_content.remark = !parent_tr.find('textarea[name=product-remark-input-field]').val() || is_whitespace(parent_tr.find('textarea[name=product-remark-input-field]').val()) ? '' : parent_tr.find('textarea[name=product-remark-input-field]').val();
        preview_product_content.product_name = !parent_tr.find('input[name=product-name-input-field]').val() || is_whitespace(parent_tr.find('input[name=product-name-input-field]').val()) ? '' : parent_tr.find('input[name=product-name-input-field]').val();
        preview_product_content.unit_size = parent_tr.find('input[name=unit-size-input-field]').val();
        preview_product_content.product_size = !parent_tr.find('input[name=product-size-input-field]').val() || is_whitespace(parent_tr.find('input[name=product-size-input-field]').val()) ? '' : parent_tr.find('input[name=product-size-input-field]').val();
        preview_product_content.order_unit_name = parent_tr.find('div[name=order-unit-choice-selection]').find('.nav-link').text();
        preview_product_content.order_size_desc_txt = is_whitespace(preview_product_content.product_size) ? `${preview_product_content.unit_size} - ${preview_product_content.order_unit_name}` : `${preview_product_content.product_size} - ${preview_product_content.unit_size} - ${preview_product_content.order_unit_name}`;
        
        render_product_card_preview(sanitise_json_obj(preview_product_content), PRODUCT_CARD_PREVIEW_MODAL.find('.modal-dialog'));
        PRODUCT_CARD_PREVIEW_MODAL.modal('show');
    });

    //Filter function
    $(document).on('keyup change', `${product_filter_checkbox_func_names}, input[name=sort-option-radio-checkbox], input[name=product-search-input-field], .search-text-field.filter-search-text-field`, function(event){
        let no_filter = true;
        FILTER_DROPDOWNS.forEach(dropdown => {
            no_filter = no_filter && $(`input[name=${dropdown.attr('name')}-checkbox]:checked`).length < 1;
        });
        disable_button(CLEAR_FILTER_BTN, !$('input[name=product-search-input-field]').val() && $('input[name=sort-option-radio-checkbox]:checked').length < 1 && no_filter);
        //disable_button(CLEAR_FILTER_BTN, APPLY_FILTER_BTN.prop('disabled'));
    });

    function ready_load_more_query(complete=false){
        disable_filter_elements(!complete, PRODUCT_INFO_TABLE.closest('section').find('.product-quantity-input-field, .item-active-state-switch, .long-txt-edit-field, div[name=product-info-btn], .opt-selection-btn'));
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN);
    }

    function ready_loading_query(complete=false){
        ready_load_more_query(complete);
        if (!complete) {
            CURR_PAGE_NUM = 1;
            FORMATTED_UOM_PRODUCTS = [];
        }
        $('section[name=inserted-product-info-section]').toggle(true);
    }

    $('.init-resource-query-btn').on('click', function(event){
        const this_btn = $(this);
        const is_loadmore = this_btn.attr('name') === LOAD_MORE_PRODUCTS_BTN.attr('name');

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button($('.init-resource-query-btn'), true);
        disable_button(this_btn, true, BSTR_BORDER_SPINNER);

        const {filtered_product_name_xml_query,
                filtered_brand_xml_query,
                filtered_subcategory_xml_query, filtered_category_xml_query,
                filtered_active_status_xml_query,
            } = get_xml_filter_queries();

        if (is_loadmore){
            ready_load_more_query();
            PRODUCT_INFO_TABLE.closest('.overflow-scroll').scrollTop(PRODUCT_INFO_TABLE.closest('.overflow-scroll').prop('scrollHeight'));
        }else{
            PRODUCT_INFO_TABLE.find('tbody').empty();
            ready_loading_query();
        }

        function _complete_request(){
            $('.content-section.order-history-content-section').toggle(true);
            ready_loading_query(true);
            disable_button(CLEAR_FILTER_BTN, false);
            disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');
            disable_button(LOAD_MORE_PRODUCTS_BTN, false, 'Load More');
            CURR_PAGE_NUM > 0 ? LOAD_MORE_PRODUCTS_BTN.show() : LOAD_MORE_PRODUCTS_BTN.hide();
        }

        $.ajax({
            type: 'POST',
            url: 'https://prod-22.australiasoutheast.logic.azure.com:443/workflows/12592137030948bd879a4e6655157c3a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Pq2Xlg6Gll4wu27BwyylPE8f7LOVGX8TitRGb9lN96o',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({'filtered_brand_xml_query': filtered_brand_xml_query, 
                                    'filtered_product_name_xml_query': filtered_product_name_xml_query, 
                                    'filtered_subcategory_xml_query': filtered_subcategory_xml_query, 
                                    'filtered_category_xml_query': filtered_category_xml_query,
                                    'filtered_active_status_xml_query': filtered_active_status_xml_query,
                                    'xml_sort_query': get_xml_sort_queries(),
                                    'page_num': CURR_PAGE_NUM,
                                    'num_items': MAX_RECORD_NUM}),
            complete: function(response, status, xhr){
                _complete_request();
            },
            success: function(response, status, xhr){
                response.products.forEach(product => {
                    const formatted_product = format_json_product(product);
                    FORMATTED_UOM_PRODUCTS.push(formatted_product);
                    PRODUCT_INFO_TABLE.find('tbody').append(make_product_tr_markup(formatted_product, PRODUCT_INFO_TABLE));
                });
                
                CURR_PAGE_NUM = response.has_next ? CURR_PAGE_NUM + 1 : 0;
                _complete_request();
            }
        });
        disable_filter_elements(true);
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        $('.content-section.order-history-content-section').toggle(false);
        CURR_PAGE_NUM = 1;
        $('input[name=product-search-input-field]').val(null);
        $(document).find('.form-check-input').prop('checked', false);
        $(document).find('.form-check-input').attr('checked', false);

        ready_loading_query();
        $('div[name=progress-resource-loader-container]').toggle(false);
        disable_filter_elements(false);

        $('ul[name=xml-product-sort-opts]').find('input[type="radio"]').prop('checked', false);
        $('input[name=xml-sort-option-radio-checkbox][data-attrname="prg_name"][data-isdesc="false"').prop('checked', true);

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, false);
        PRODUCT_INFO_TABLE.find('tbody').empty();
    });

    // Modal functions
    $(document).on('click', '.close-modal-btn', function(event){
        if (IS_UPDATING_IMG) return;
        $(this).closest('.modal').modal('hide');
    });

    UPLOAD_IMG_MODAL.on('hide.bs.modal', function (e) {
        if (IS_UPDATING_IMG){
            // Prevent auto closing modal if POST Request has not completed
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
    });

    function render_img_preview(preview_container, img_url){
        preview_container.empty();
        preview_container.append(`<img src='${img_url}'/>`);
    }

    //Product Info Button function
    $(document).on('click', 'div[name=product-info-btn]', function(){
        const parent_tr = $(this).closest('tr');
        const formatted_product = parent_tr.attr('data-productuid') === INSERTED_UOM_PRODUCT.product_uid ? INSERTED_UOM_PRODUCT : FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid === parent_tr.attr('data-productuid'))[0];
        
        if (formatted_product === undefined) return;
        UPLOAD_IMG_MODAL.attr('data-targetedproduct', parent_tr.attr('data-productuid'));
        const has_empty_img = formatted_product.img_content === undefined || formatted_product.img_content_mime_type === undefined;

        PRODUCT_IMG_CONTAINER.empty();
        if (!has_empty_img) render_img_preview(PRODUCT_IMG_CONTAINER, covert_product_b64_img_to_url(formatted_product.img_content_mime_type, formatted_product.img_content));
        disable_button(UPLOAD_PRODUCT_IMG_BTN, true, 'Upload Image');
        disable_button(REMOVE_PRODUCT_IMG_BTN, has_empty_img, 'Remove Image');
        UPLOAD_IMG_MODAL.find('.card-container').toggle(!has_empty_img);
        UPLOAD_IMG_MODAL.modal('show');
    });


    $(document).on('change drop', '#UploadImgInput', function(){
        const files = document.getElementById('UploadImgInput').files;
        const formatted_product = UPLOAD_IMG_MODAL.attr('data-targetedproduct') === INSERTED_UOM_PRODUCT.product_uid ? INSERTED_UOM_PRODUCT : FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid === UPLOAD_IMG_MODAL.attr('data-targetedproduct'))[0];
        
        if (formatted_product === undefined) return;
        if (files[0] === undefined || !files[0].type.startsWith('image/')) {
            disable_button(UPLOAD_PRODUCT_IMG_BTN, true);
            //return alert('Invalid image format');
        }
        
        resize_img(files[0], MAX_IMG_SIZE_KB, function(resized_file){
            is_b64_str_longer_than_allowed(resized_file, function(exceeded){
                UPLOAD_IMG_MODAL.find('.card-container').toggle(!exceeded);
                if (exceeded) return alert('File size larger than allowed');
                PRODUCT_IMG_CONTAINER.empty();
                formatted_product.img_file = resized_file;
                render_img_preview(PRODUCT_IMG_CONTAINER, URL.createObjectURL(resized_file));
                disable_button(UPLOAD_PRODUCT_IMG_BTN, false);
            });
        });
    });

    UPDATE_PRODUCT_IMG_BTN.on('click', async function(event){
        const is_inserted_product = UPLOAD_IMG_MODAL.attr('data-targetedproduct') === INSERTED_UOM_PRODUCT.product_uid;
        const formatted_product = is_inserted_product ? INSERTED_UOM_PRODUCT : FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid === UPLOAD_IMG_MODAL.attr('data-targetedproduct'))[0];
        if (formatted_product === undefined) return;

        const this_btn = $(this);
        const is_removed = this_btn.attr('name') === REMOVE_PRODUCT_IMG_BTN.attr('name');

        function _ready_img_update(complete=false){
            IS_UPDATING_IMG = !complete;
            disable_button(UPDATE_PRODUCT_IMG_BTN, !complete);
            disable_filter_elements(!complete, $('#UploadImgInput'));
            if (!complete) disable_button(this_btn, true, BSTR_BORDER_SPINNER);
        }

        function _modify_img_updates(corresponding_tr, b64_content){
            formatted_product.img_content = is_removed ? undefined : b64_content[1];
            formatted_product.img_content_mime_type = is_removed ? undefined : b64_content[0];
            formatted_product.thumbnail_img = covert_product_b64_img_to_url(formatted_product.img_content_mime_type, formatted_product.img_content);

            corresponding_tr.find('div[name=product-info-btn]').empty();
            corresponding_tr.find('div[name=product-info-btn]').append(`<img src='${formatted_product.thumbnail_img}'>`);

            if (is_removed){
                PRODUCT_IMG_CONTAINER.empty();
                PRODUCT_IMG_CONTAINER.closest('.card-container').toggle(false);
                formatted_product.img_file = undefined;
            }
        }

        function on_img_update_success(){
            _ready_img_update(true);
            disable_button(UPLOAD_PRODUCT_IMG_BTN, true, 'Upload Image');
            disable_button(REMOVE_PRODUCT_IMG_BTN, true, 'Remove Image');
            if (!is_removed) disable_button(REMOVE_PRODUCT_IMG_BTN, false, 'Remove Image');
        }

        try{
            _ready_img_update();
            const b64_content = is_removed ? ['', ''] : get_base64_contents(await convert_to_base64(formatted_product.img_file));
            if (is_inserted_product){
                _modify_img_updates(INSERTED_PRODUCT_INFO_TABLE.find('tbody').find('tr'), b64_content);
                return on_img_update_success();
            }

            $.ajax({
                type: 'POST',
                url: 'https://prod-04.australiasoutheast.logic.azure.com:443/workflows/68713652379b409d8f74a1a288db01ce/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=pOOeAZ1811tHfRxLA36zaFUjFJ8YMMIgYL3Y6JnKfi4',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({
                    'product_uid': formatted_product.product_uid,
                    'img_content': b64_content[1],
                    'img_content_mime_type': b64_content[0],
                    'remove': is_removed,
                }),
                complete: function(response, status, xhr){on_img_update_success();},
                success: function(response, status, xhr){
                    _modify_img_updates(PRODUCT_INFO_TABLE.find(`tr[data-productuid='${formatted_product.product_uid}']`), b64_content);
                    alert(`Successfully ${is_removed ? 'removed' : 'updated'} thumbnail image for ${formatted_product.product_name}`);
                },
                error: function(response, status, xhr){
                    alert('Error updating image');
                },
            });
            
        }catch (error){
            _ready_img_update(true);
            alert('Error reading image');
            console.error(error);
            UPLOAD_IMG_MODAL.modal('hide');
        }
    });


    // Product Info Input Change Functions
    $(document).on('change keyup', '.attr-selection-opt-radio-checkbox', function(event){
        const parent_tr = $(this).closest('tr');
        const main_container = $(this).closest('#sort-container');
        
        const _label = $(this).closest('div').find('.form-check-label').text();
        const _value = $(this).attr('data-value');
        main_container.find('.nav-link').text(_label);
        parent_tr.attr(`${main_container.attr('data-affectedvalue')}`, _value);
        parent_tr.attr(`${main_container.attr('data-affectedlabel')}`, _label);
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', '.product-quantity-input-field', function(event){
        remove_input_red_color($(this));
        const is_int = ['product-min-quantity-input-field', 'unit-size-input-field'].includes($(this).attr('name'));
        const max = is_int ? parseInt($(this).attr('data-max')) : parseFloat($(this).attr('data-max'));
        const min =  is_int ? parseInt($(this).attr('data-min')) : parseFloat($(this).attr('data-min'));
        const valid_input = verify_number_input($(this), is_int, min, max);
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', 'input[name=product-size-input-field], input[name=bar-code-input-field], textarea[name=product-remark-input-field]', function(event){
        remove_input_red_color($(this));
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', 'input[name=product-active-state-switch]', function(event){
        remove_input_red_color($(this));
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', 'input[name=product-name-input-field]', function(event){
        remove_input_red_color($(this));
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    // Reset Empty Input Values
    $(document).on('blur', '.product-quantity-input-field, input[name=product-name-input-field]', function(event){
        const parent_tr = $(this).closest('tr');
        const is_inserted_product = is_product_table_row_from_insertion($(this));
        const formatted_product = is_inserted_product ? INSERTED_UOM_PRODUCT : FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid === parent_tr.attr('data-productuid'))[0];
        if (formatted_product === undefined) return;
        if (!$(this).val() || is_whitespace($(this).val())){
            if ($(this).attr('name') === 'product-min-quantity-input-field') {
                $(this).val(formatted_product.min_quantity);
            }else if ($(this).attr('name') === 'unit-size-input-field') {
                $(this).val(formatted_product.unit_size);
            }else if ($(this).attr('name') === 'product-name-input-field' && !is_inserted_product) {
                $(this).val(formatted_product.product_name);
            }
        }
    });

    // Apply Product Update function
    APPLY_PRODUCT_INFO_CHANGES_BTN.on('click', function(event){
        function _ready_elem_for_changes(disabled=true, complete=false){
            if (disabled){
                disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true, BSTR_BORDER_SPINNER);
            }else{
                let error_msg = 'Error Invalid Inputs detected for:';
                PRODUCT_INFO_TABLE.find('tbody').find('tr').each(function(){
                    const has_err = $(this).find(`.${ERR_INPUT_INDICATOR_CLASS}`).length > 0;
                    if (!has_err) return;
                    error_msg = `${error_msg}\n\t${$(this).attr('data-productname')}`;
                });
                if (!complete) alert(error_msg);
                disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true, 'Apply Changes');
            }
            disable_filter_elements(!complete, APPLY_PRODUCT_INFO_CHANGES_BTN.closest('section').find('.product-quantity-input-field, .item-active-state-switch, .long-txt-edit-field, div[name=product-info-btn], td[name=product-card-preview-btn], .opt-selection-btn'));
            disable_button(CLEAR_FILTER_BTN, !complete);
            if (CURR_PAGE_NUM > 0) disable_button(LOAD_MORE_PRODUCTS_BTN, !complete);
        }

        _ready_elem_for_changes();
        const is_valid = verify_valid_info_fields(PRODUCT_INFO_TABLE.attr('name'));
        if (!is_valid) return _ready_elem_for_changes(false, true);

        let _updated_products = [];

        PRODUCT_INFO_TABLE.find('tbody').find(`tr[name=${PRODUCT_INFO_TABLE.attr('name')}-row]`).each(function(){
            const formatted_product = FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid ===  $(this).attr('data-productuid'))[0];
            if (formatted_product === undefined) return;

            const new_product_name = $(this).find('input[name=product-name-input-field]').val();
            const new_product_min_quantity = parseInt($(this).find('input[name=product-min-quantity-input-field]').val());
            const new_product_unit_size = parseInt($(this).find('input[name=unit-size-input-field]').val());
            const new_category_uid = $(this).attr('data-categoryuid');
            const new_sub_category_uid = $(this).attr('data-subcategoryuid');
            const new_brand_code = $(this).attr('data-brandcode');
            const new_bulk_order_unit_code = parseInt($(this).attr('data-bulkorderunitcode'));
            const new_order_unit_code = parseInt($(this).attr('data-orderunitcode'));
            const new_product_size = !$(this).find('input[name=product-size-input-field]').val() || is_whitespace($(this).find('input[name=product-size-input-field]').val()) ? '' : $(this).find('input[name=product-size-input-field]').val();
            const new_product_barcode = !$(this).find('input[name=bar-code-input-field]').val() || is_whitespace($(this).find('input[name=bar-code-input-field]').val()) ? '' : $(this).find('input[name=bar-code-input-field]').val();
            const new_product_remark = !$(this).find('textarea[name=product-remark-input-field]').val() || is_whitespace($(this).find('textarea[name=product-remark-input-field]').val()) ? '' : $(this).find('textarea[name=product-remark-input-field]').val();
            const new_active_status = $(this).find('input[name=product-active-state-switch]').prop('checked');

            if (new_product_name !== formatted_product.product_name
                || new_product_min_quantity !== formatted_product.min_quantity
                || new_product_unit_size !== formatted_product.unit_size
                || new_category_uid !== formatted_product.category_uid
                || new_sub_category_uid !== formatted_product.subcategory_uid
                || new_brand_code !== String(formatted_product.brand_code)
                || new_bulk_order_unit_code !== formatted_product.bulk_order_unit_code
                || new_order_unit_code !== formatted_product.order_unit_code
                || new_product_size !== formatted_product.product_size
                || new_product_barcode !== formatted_product.product_barcode
                || new_product_remark !== formatted_product.remark
                || new_active_status !== formatted_product.is_active)
                _updated_products.push({
                    'product_uid': formatted_product.product_uid,
                    'new_product_name': new_product_name,
                    'new_product_name_trimmed': clean_white_space(new_product_name.trim().toLowerCase()),
                    'new_product_min_quantity': new_product_min_quantity,
                    'new_product_unit_size': new_product_unit_size,
                    'new_category_uid': new_category_uid,
                    'new_category_name': $(this).attr('data-categoryname'),
                    'new_sub_category_uid': new_sub_category_uid,
                    'new_sub_category_name': $(this).attr('data-subcategoryname'),
                    'new_brand_code': new_brand_code,
                    'new_brand_name': $(this).attr('data-brandname'),
                    'new_bulk_order_unit_code': new_bulk_order_unit_code,
                    'new_bulk_order_unit_name': $(this).attr('data-bulkorderunitname'),
                    'new_order_unit_code': new_order_unit_code,
                    'new_order_unit_name': $(this).attr('data-orderunitname'),
                    'new_product_size': new_product_size,
                    'new_product_barcode': new_product_barcode,
                    'new_product_remark': new_product_remark,
                    'new_active_status': new_active_status
                });
        });
        if (_updated_products.length < 1) return _ready_elem_for_changes(false, true);
        
        $.ajax({
            type: 'POST',
            url: 'https://prod-20.australiasoutheast.logic.azure.com:443/workflows/d2179a4a0b5449a7b426f904af9ad8ad/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N_Ikd6QrsJNAA9dTllvaIYQ08ByNVXcIBIEMtkqwVVY',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify(_updated_products),
            complete: function(response, status, xhr){
                _ready_elem_for_changes(false, true);
            },success: function(response, status, xhr){
                _updated_products.forEach(updated_product => {
                    const formatted_product = FORMATTED_UOM_PRODUCTS.filter(product => product.product_uid ===  updated_product.product_uid)[0];
                    const corresponding_tr = PRODUCT_INFO_TABLE.find('tbody').find(`tr[name=${PRODUCT_INFO_TABLE.attr('name')}-row][data-productuid='${updated_product.product_uid}']`);

                    if (formatted_product === undefined || corresponding_tr.length < 1) return;

                    formatted_product.product_name = updated_product.new_product_name;
                    formatted_product.product_trimmed_name = updated_product.new_product_name_trimmed;
                    formatted_product.min_quantity = updated_product.new_product_min_quantity;
                    formatted_product.unit_size = updated_product.new_product_unit_size;
                    formatted_product.category_uid = updated_product.new_category_uid;
                    formatted_product.category_name = updated_product.new_category_name;
                    formatted_product.subcategory_uid = updated_product.new_sub_category_uid;
                    formatted_product.subcategory_name = updated_product.new_sub_category_name;
                    formatted_product.brand_code = updated_product.new_brand_code;
                    formatted_product.brand_name = updated_product.new_brand_name;
                    formatted_product.bulk_order_unit_code = updated_product.new_bulk_order_unit_code;
                    formatted_product.bulk_order_unit_name = updated_product.new_bulk_order_unit_name;
                    formatted_product.order_unit_code = updated_product.new_order_unit_code;
                    formatted_product.order_unit_name = updated_product.new_order_unit_name;
                    formatted_product.product_size = updated_product.new_product_size;
                    formatted_product.product_barcode = updated_product.new_product_barcode;
                    formatted_product.remark = updated_product.new_product_remark;
                    formatted_product.is_active = updated_product.new_active_status;

                    corresponding_tr.attr('data-productname', updated_product.new_product_name);
                    corresponding_tr.attr('data-productnametrimmed', updated_product.new_product_name_trimmed);
                    corresponding_tr.find('input[name=product-name-input-field]').attr('placeholder', updated_product.new_product_name);

                    corresponding_tr.attr('data-minquantity', updated_product.new_product_min_quantity);
                    corresponding_tr.find('input[name=product-min-quantity-input-field]').attr('placeholder', updated_product.new_product_min_quantity);

                    corresponding_tr.attr('data-unitsize', updated_product.new_product_unit_size);
                    corresponding_tr.find('input[name=unit-size-input-field]').attr('placeholder', updated_product.new_product_unit_size);

                    corresponding_tr.attr('data-productsize', updated_product.new_product_size);
                    corresponding_tr.find('input[name=product-size-input-field]').attr('placeholder', updated_product.new_product_size);

                    corresponding_tr.attr('data-barcode', updated_product.new_product_barcode);
                    corresponding_tr.find('input[name=bar-code-input-field]').attr('placeholder', updated_product.new_product_barcode);

                    corresponding_tr.attr('data-remark', updated_product.new_product_remark);
                    corresponding_tr.find('input[name=product-remark-input-field]').attr('placeholder', updated_product.new_product_remark);
                });
                alert(`Successfully updated ${_updated_products.length} product${_updated_products.length > 1 ? 's' : ''}.`);
            }, error: function(response, status, xhr){
                if (status === 'timeout') return alert('Request timed out');
                alert('Failed to apply updates');
            }
        });
    });

    // Apply Product Insertion Function
    APPLY_INSERT_PRODUCT_BTN.on('click', function(event){
        function _ready_elem_for_changes(disabled=true, complete=false){
            disable_button(APPLY_INSERT_PRODUCT_BTN, true, disabled ? BSTR_BORDER_SPINNER : 'Confirm Add');
            disable_filter_elements(!complete, APPLY_INSERT_PRODUCT_BTN.closest('section').find('.product-quantity-input-field, .item-active-state-switch, .long-txt-edit-field, div[name=product-info-btn], td[name=product-card-preview-btn], .opt-selection-btn'));
            disable_button(CLEAR_FILTER_BTN, !complete);
            if (CURR_PAGE_NUM > 0) disable_button(LOAD_MORE_PRODUCTS_BTN, !complete);
        }
        _ready_elem_for_changes();
        let _new_products = [];
        INSERTED_PRODUCT_INFO_TABLE.find('tbody').find(`tr[name=${INSERTED_PRODUCT_INFO_TABLE.attr('name')}-row]`).each(function(){
            _new_products.push({
                'product_name':  $(this).find('input[name=product-name-input-field]').val(),
                'img_content': INSERTED_UOM_PRODUCT.img_content ?? '',
                'img_content_mime_type': INSERTED_UOM_PRODUCT.img_content_mime_type ?? '',
                'new_product_name_trimmed': clean_white_space($(this).find('input[name=product-name-input-field]').val().trim().toLowerCase()),
                'category_uid': $(this).attr('data-categoryuid'),
                'subcategory_uid': $(this).attr('data-subcategoryuid'),
                'brand_code': $(this).attr('data-brandcode'),
                'order_unit_code': parseInt($(this).attr('data-orderunitcode')),
                'bulk_order_unit_code': parseInt($(this).attr('data-bulkorderunitcode')),
                'min_quantity': parseInt($(this).find('input[name=product-min-quantity-input-field]').val()),
                'unit_size': parseInt($(this).find('input[name=unit-size-input-field]').val()),
                'product_size': !$(this).find('input[name=product-size-input-field]').val() || is_whitespace($(this).find('input[name=product-size-input-field]').val()) ? '' : $(this).find('input[name=product-size-input-field]').val(), 
                'product_barcode': !$(this).find('input[name=bar-code-input-field]').val() || is_whitespace($(this).find('input[name=bar-code-input-field]').val()) ? '' : $(this).find('input[name=bar-code-input-field]').val(), 
                'remark': !$(this).find('textarea[name=product-remark-input-field]').val() || is_whitespace($(this).find('textarea[name=product-remark-input-field]').val()) ? '' : $(this).find('textarea[name=product-remark-input-field]').val(), 
                'active_status': $(this).find('input[name=product-active-state-switch]').prop('checked'),
            });
        });

        if (_new_products.length < 1) return _ready_elem_for_changes(false, true);
        $.ajax({
            type: 'POST',
            url: 'https://prod-17.australiasoutheast.logic.azure.com:443/workflows/f125559c6ea7432b95c13bd4ea33170f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dhKvbfOtgRg78NME1efCkjelkfVCx6fzdOeyGO_iVQI',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify(_new_products),
            complete: function(response, status, xhr){
                _ready_elem_for_changes(false, true);
            },success: function(response, status, xhr){
                response.new_products.forEach(new_product => {
                    const formatted_product = format_json_product(new_product);
                    FORMATTED_UOM_PRODUCTS.push(formatted_product);
                    PRODUCT_INFO_TABLE.find('tbody').prepend(make_product_tr_markup(formatted_product, PRODUCT_INFO_TABLE));
                });
                render_inserted_product_table();
                alert('Successfully added new products, to see more details click filter by their names or sort by Created On/Modified On descending');
            },
            error: function(response, status, xhr){
                alert('Failed to add new product at this time');
            }
        });
    });
});