const CUSTOMER_UID = 'e391c7cb-e9c7-ed11-b597-00224897d329';
const AJAX_TIMEOUT_DURATION = 864000000;
const MAX_FILE_SIZE = 131072000; // in KB
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');
const UPLOAD_FILE_BTN = $('button[name=upload-product-img]');
const DOWNLOAD_FILE_BTN = $('button[name=down-load-file]');
const OPEN_INVOICE_UPLOAD_BTN = $('span[name=attach-invoice-file-btn]');
const UPLOAD_INVOICE_FIELD = $('input[name=upload-img-input]');
let FILE_DOWNLOAD_LINK = undefined;

const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');
const APPLY_ORDER_INFO_CHANGES_BTN = $('button[name=apply-order-info-changes-btn]');

const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PROGRESS_BAR_DOM = $('div[name=request-loader-progress-bar]');
const ORDER_HISTORY_TABLE = $('table[name=order-history-table]');

const DATE_RANGE_PICKER_CLASS = $('.date-range-picker-input');
const ORDER_DATE_FILTER_DROPDOWN = $('input[name="order-date-range"]');
const VENDOR_FILTER_DROPDOWN = $('ul[name=vendor-filter-opts]');
const PRODUCT_FILTER_DROPDOWN = $('ul[name=product-filter-opts]');
const CATEGORY_FILTER_DROPDOWN = $('ul[name=category-filter-opts]');
const SUBCATEGORY_FILTER_DROPDOWN = $('ul[name=sub-category-filter-opts]');
const BRAND_FILTER_DROPDOWN = $('ul[name=brand-filter-opts]');
const ORDER_STATUS_FILTER_DROPDOWN = $('ul[name=order-status-filter-opts]');
const PAYMENT_STATUS_FILTER_DROPDOWN = $('ul[name=payment-status-filter-opts]');
let product_filter_checkbox_func_names = '';
const FILTER_DROPDOWNS = [VENDOR_FILTER_DROPDOWN, CATEGORY_FILTER_DROPDOWN, SUBCATEGORY_FILTER_DROPDOWN, BRAND_FILTER_DROPDOWN, ORDER_STATUS_FILTER_DROPDOWN, PAYMENT_STATUS_FILTER_DROPDOWN, PRODUCT_FILTER_DROPDOWN];
FILTER_DROPDOWNS.forEach((dropdown, idx) => {
    product_filter_checkbox_func_names += `input[name=${dropdown.attr('name')}-checkbox]${idx < FILTER_DROPDOWNS.length - 1 ? ', ' : ''}`;
});

let FORMATTED_UOM_ORDERS = [];

const PAYMENT_ORDER_STATUS_STAT_CONTAINER = $('div[name=order-payment-status-stat-container]');
const VENDOR_ORDER_STAT_CONTAINER = $('div[name=order-vendor-stat-container]');
const CATEGORY_ORDER_STAT_CONTAINER = $('div[name=order-category-stat-container]');
const SUBCATEGORY_ORDER_STAT_CONTAINER = $('div[name=order-subcategory-stat-container]');
const WEEK_OF_YR_ORDER_STAT_CONTAINER = $('div[name=order-weekofyear-stat-container]');

const ORDER_STATUS_FILTER_OPTS = [
    {'value': 1, 'label': 'Ordered', 'colour': '#0067B9', 'selectable': false, 'text_color': 'white'},
    {'value': 2, 'label': 'Approved', 'colour': '#84BD00', 'selectable': false, 'text_color': 'white'},
    {'value': 3, 'label': 'Rejected', 'colour': '#F57F25', 'selectable': false, 'text_color': 'white'},
    {'value': 4, 'label': 'Received In-Full', 'colour': '#B0008E', 'selectable': true, 'text_color': 'white'},
    {'value': 5, 'label': 'Partially Received', 'colour': '#FFCD00', 'selectable': true, 'text_color': '#3D3935'},
    {'value': 6, 'label': 'Cancelled', 'colour': '#E9E9E9', 'selectable': false, 'text_color': '#3D3935'},
    {'value': 7, 'label': 'Error', 'colour': 'red', 'selectable': true, 'text_color': 'white'},
    {'value': 8, 'label': 'Awaiting', 'colour': '#0C2340', 'selectable': false, 'text_color': 'white'},
    {'value': 9, 'label': 'Closed', 'colour': '#D7DF23', 'selectable': false, 'text_color': 'white'},
];

const APPROVED_ORDER_STATUS_CODES = [2, 4, 5, 7];
const ELIGIBLE_TICKET_STATUS_CODES = [1, 2, 4, 5, 7, 8];

const PAYMENT_STATUS_FILTER_OPTS = [
    {'value': 0, 'label': 'Pending Payment', 'colour': '#0067B9'},
    {'value': 1, 'label': 'Payment Received', 'colour': '#84BD00'},
    {'value': 2, 'label': 'Order Refunded', 'colour': 'red'},
]

let brand_filter_options = [];
let product_filter_options = [];
let category_filter_options = [];
let subcategory_filter_options = [];
let vendor_filter_options = [];
let week_of_yr_data = [];

let targeted_uom_order = undefined;
const CANCEL_ORDER_BTN = $('button[name=cancel-order-btn]');
const RETURN_ORDER_BTN = $('button[name=request-return-order-btn]');
const ST_WRONG_ORDER_BTN = $('button[name=st-wrong-order-btn]');
const ORDER_TICKET_FORM_MODAL = $('div[name=issue-order-ticket-modal]');
const UPLOAD_INVOICE_MODAL = $('div[name=product-img-modal]');
const ORDER_TICKET_TITLE_INPUT = $('input[name=order-issue-ticket-title-input]');
const ORDER_TICKET_DESC_INPUT = $('input[name=order-issue-ticket-desc-input]');
const DISABLED_ELEM_CLASS = 'disabled-element';
const TODAY_DATE = new Date();
const ONE_MONTH_AGO = new Date();
ONE_MONTH_AGO.setMonth(TODAY_DATE.getMonth() - 1);

/*Util Functions*/
function get_user_id(){
    const elem_user_id = '{{user.id}}';
    return elem_user_id.includes('{{') && elem_user_id.includes('}}') ? undefined : elem_user_id;
    //return elem_user_id.includes('{{') && elem_user_id.includes('}}') ? null : elem_user_id;
}

function clean_white_space(input_string, all=true){
    return input_string.replace(/\s+/g, all ? '' : ' ');
}

function trim_and_to_regex(input_str, clean_all=true){
    return clean_white_space(input_str.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, ''), clean_all);
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

function _get_text_padding(max_length, curr_txt, html_tag='span'){
    return '';
    let padding_length = max_length - curr_txt.length;
    if (padding_length < 1) padding_length = 1;
    return `<${html_tag} id='text-padding'>${'#'.repeat(max_length - curr_txt.length)}</${html_tag}>`;
}

function verify_integer_input(integer_input, place_holder='', min_value=Number.NEGATIVE_INFINITY, max_value=Number.POSITIVE_INFINITY){
    // Format an Input text Field's value to integers and verify whether the resulting integer
    // is within the min max range. If the value is out of range assign it with min or max value
    let valid_input = true;
    let curr_value = integer_input.val();
    if (!integer_input.val() || is_whitespace(curr_value)) return valid_input;
    curr_value = parseInt(curr_value.replace(/\D/g, ''));
    if (isNaN(curr_value)){
        integer_input.val(null);
        return false;
    }
    if (curr_value < min_value) curr_value = min_value;
    if (curr_value > max_value) curr_value = max_value;
    integer_input.val(curr_value);
    return curr_value >= min_value;
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

function convert_b64_img_str_to_url(mime_type, b64_str){
    return URL.createObjectURL(data_url_to_blob(`data:${mime_type};base64,` + b64_str));
}

function convert_base64_list_to_img(uploaded_img_content){
    let formatted_img_content = [];
    uploaded_img_content.forEach(uploaded_img => {
        if (is_json_data_empty(uploaded_img.prg_img_b64) || is_whitespace(uploaded_img.prg_mime_type)) return;
        const _blob = data_url_to_blob(`data:${uploaded_img.prg_mime_type};base64,` + uploaded_img.prg_img_b64);
        if (_blob === null) return;
        formatted_img_content.push({
            'img_uid': uploaded_img.prg_gappmtoimagemapid,
            'img_url': URL.createObjectURL(_blob),
            'mime_type': uploaded_img.prg_mime_type,
        });
    });
    return formatted_img_content;
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

function covert_product_b64_img_to_url(mime_type, b64_str){
    if (is_json_data_empty(mime_type) || is_json_data_empty(b64_str)
    || is_whitespace(mime_type) || is_whitespace(b64_str)) return PLACE_HOLDER_IMG_URL;
    try{
        return convert_b64_img_str_to_url(mime_type, b64_str);
    }catch(error){
        return PLACE_HOLDER_IMG_URL;
    }
}

function hide_elems_on_load(complete=false){
    $('div[name=progress-resource-loader-container]').toggle(false);
    $('.content-section').toggle(complete);
    $('.resource-loader-section').toggle(!complete);
}

function disable_button(button_dom, disabled, replace_markup=null){
    button_dom.attr('disabled', disabled);
    button_dom.css('background', `${disabled ? '#E9E9E9' : '#FAF9F6'}`);
    if (replace_markup != null && typeof replace_markup == 'string'){
        button_dom.empty();
        button_dom.append(replace_markup);
    }
}

function disable_filter_elements(disabled=true, elem_markup=undefined){
    const target_elems = elem_markup ?? $('div[name=mass-order-status-selection-opt-container]');
    disabled ? target_elems.addClass(DISABLED_ELEM_CLASS) : target_elems.removeClass(DISABLED_ELEM_CLASS);
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


function verify_integer_input(integer_input, place_holder='', min_value=Number.NEGATIVE_INFINITY, max_value=Number.POSITIVE_INFINITY){
    let valid_input = true;
    let curr_value = integer_input.val();
    if (!integer_input.val() || is_whitespace(curr_value)) return valid_input;
    curr_value = parseInt(curr_value.replace(/\D/g, ''));
    if (isNaN(curr_value)){
        integer_input.val(null);
        return false;
    }
    if (curr_value < min_value) curr_value = min_value;
    if (curr_value > max_value) curr_value = max_value;
    integer_input.val(curr_value);
    return curr_value >= min_value;
}

function render_loading_progress_bar(curr_progress=0){
    curr_progress = curr_progress < 0 ? 0 : curr_progress;
    curr_progress = curr_progress > 100 ? 100 : curr_progress;

    PROGRESS_BAR_DOM.attr('aria-valuenow', curr_progress);
    PROGRESS_BAR_DOM.css('width', `${curr_progress}%`);
}

function extract_all_data_uid_attributes(target_element, to_formatted_str=false) {
    const pattern = /data-([a-zA-Z]+)uid="(.*?)"/g;
    const attr_pairs = [];
    let match;
    while ((match = pattern.exec(target_element.prop("outerHTML"))) !== null) {
        const attr_name = `data-${match[1]}uid`;
        const attr_value = match[2];
        attr_pairs.push({ name: attr_name, value: attr_value });
    }
    return !to_formatted_str ? attr_pairs : attr_pairs.map(attr_pair => `[${attr_pair.name}="${attr_pair.value}"]`).join('');
}

function extract_all_parent_target_data_attributes(target_element, to_formatted_str=false) {
    const pattern = /data-parenttargetdatavalue(\d+)="(.*?)"/g;
    const attr_pairs = [];
    let match;
    while ((match = pattern.exec(target_element.prop("outerHTML"))) !== null) {
        attr_pairs.push({name: match[0].split('=')[0], value: match[2], idx: parseInt(match[1])});
    }
    return !to_formatted_str ? attr_pairs : attr_pairs.map(attr_pair => `[${attr_pair.name}="${attr_pair.value}"]`).join('');
}

function extract_sub_object(og_obj, key_pattern=''){
    let extracted_obj = {};
    for (const key in og_obj) {
        if (key.startsWith(key_pattern)) extracted_obj[`${key.replace(key_pattern, "")}`] = og_obj[key];
    }
    return extracted_obj;
}

function format_obj_prg_key(og_obj) {
    const new_obj = {};
    for (const key in og_obj) {
      if (og_obj.hasOwnProperty(key)) new_obj[key.replace(/^_/, "").replace("_value", "")] = og_obj[key];
    }
    return new_obj;
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

function is_b64_str_longer_than_allowed(file, callback) {
    // Read the file content and convert it to a base64 string
    const reader = new FileReader();
    reader.onload = function(event) {
        callback(Math.abs(event.target.result.split(',')[1].length) > MAX_FILE_SIZE);
    };
    reader.readAsDataURL(file);
}

function _await_file_upload(complete=false){
    UPLOAD_FILE_BTN.attr('data-sendingrequest', !complete ? 1 : 0);
    disable_button(UPLOAD_FILE_BTN, true, complete ? 'Upload File' : BSTR_BORDER_SPINNER);
    disable_filter_elements(!complete, $(`button[name=${DOWNLOAD_FILE_BTN.attr('name')}], input[name=${UPLOAD_INVOICE_FIELD.attr('name')}]`));
}

function _wait_for_file_retrieval(parent_th, complete=false){
    if (parent_th === undefined) return;
    parent_th.empty();
    parent_th.append(complete ? `<span class="material-symbols-rounded" name='${OPEN_INVOICE_UPLOAD_BTN.attr('name')}'>attach_file</span>` : BSTR_BORDER_SPINNER);
}

function ajax_retrieve_invoice(parent_th=undefined){
    disable_button(UPLOAD_FILE_BTN, true);
    UPLOAD_INVOICE_FIELD.val(null);
    $.ajax({
        type: 'POST',
        url: 'https://prod-27.australiasoutheast.logic.azure.com:443/workflows/117156843d2c4cadb754023277685f19/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wlDtQGXovxjZ359K4XCRHo0HqIqrluBmXHR9hokFn20',
        contentType: 'application/json',
        accept: 'application/json;odata=verbose',
        timeout: AJAX_TIMEOUT_DURATION,
        data: JSON.stringify({
            'vendor_uid': targeted_uom_order.vendor_uid, 'request_uid': targeted_uom_order.request_uid,
        }),
        complete: function(response, status, xhr){
            if (parent_th !== undefined) {
                _wait_for_file_retrieval(parent_th, true);
            }else{
                _await_file_upload(true);
            }
        },
        success: function(response, status, xhr){
            UPLOAD_INVOICE_MODAL.modal('show');
            disable_button(DOWNLOAD_FILE_BTN, !response.has_file);
            DOWNLOAD_FILE_BTN.toggle(response.has_file);
            if (response.has_file){
                FILE_DOWNLOAD_LINK = document.createElement('a');
                FILE_DOWNLOAD_LINK.href = URL.createObjectURL(data_url_to_blob(`data:${response.record.crcfc_mimetype};base64,${response.base64_file}`));
                FILE_DOWNLOAD_LINK.download = response.record.crcfc_filename;
                $(`h6[name=upload-img-name-txt-container]`).text(response.record.crcfc_filename);
            }else{
                FILE_DOWNLOAD_LINK = undefined;
            }
            if (parent_th === undefined) alert('Successfully uploaded file');
        },
        error: function(response, status, xhr){
            alert('Error fetching file');
            if (parent_th !== undefined) UPLOAD_INVOICE_MODAL.modal('hide');
        },
    });
}
/*End of Util functions*/

function render_filter_options(dropdown_container, filter_opts, sort_by_label=false){
    if (sort_by_label) filter_opts = filter_opts.sort((a, b) => a.label.localeCompare(b.label));
    filter_opts.forEach(filter_opt => {
        dropdown_container.append(`
        <div class='dropdown-item'>
            <input class='form-check-input filter-opt-radio' type='checkbox' name='${dropdown_container.attr('name')}-checkbox'
                    data-label='${filter_opt.label}' data-value='${filter_opt.value}' data-parentul='${dropdown_container.attr('name')}'>
            <label class='form-check-label'>${filter_opt.label}</label>
        </div>
        `);
    });
}

function set_up_date_range_picker(date_input, min_date, max_date){
    date_input.attr('min', min_date);
    date_input.attr('data-start', parse_dt_str_and_obj(min_date, true));
    date_input.attr('max', max_date);
    date_input.attr('data-end', parse_dt_str_and_obj(max_date, true));
    date_input.val(`${date_input.attr('data-start')} - ${date_input.attr('data-end')}`);
}

function is_purchase_request_editable(orders_grouped_by_request){
    return !orders_grouped_by_request.map(formatted_uom_order => formatted_uom_order.is_beyond_approved).includes(false);
}

function make_target_data_attr_markup(parent_target_datas){
    return parent_target_datas.map((parent_target_data, idx) => `data-parenttargetdataname${idx}='${parent_target_data.name}' data-parenttargetdatavalue${idx}='${parent_target_data.value}'`).join(' ');
}

function make_collapse_tr_btn(collapse_idx, row_span, target_data_name, target_data_val, main_collapse_data_name, main_collapse_data_val, last_collapse_idx, parent_target_datas, collapsed=true, hidden=false){
    return `<br ${hidden ? ' hidden' : ''}>
    <span class="material-symbols-rounded${collapsed ? ' rotate-upside-down' : ''}" data-targetdatavalue='${target_data_val}' data-expand='${collapsed ? 0 : 1}' data-targetdata='${target_data_name}' data-rowspan='${row_span}' data-collapseidx='${collapse_idx}'
            data-maincollapsedatavalue='${main_collapse_data_val}' data-maincollapsedataname='${main_collapse_data_name}'
            data-lastcollapseidx='${last_collapse_idx}' name='collapse-table-row-group-btn' ${make_target_data_attr_markup(parent_target_datas)}
            ${hidden ? ' hidden' : ''}>expand_more</span>`;
}

function make_request_status_checkbox(checkbox_name, data_attributes){
    return `<input class='form-check-input filter-opt-radio update-order-status-btn' 
                        type='checkbox' name='${checkbox_name}'
                        ${data_attributes.map(data_attr => `${data_attr.data_name}='${data_attr.data_val}'`).join(' ')}/>`;
}

function render_order_history_data_row(sort_latest=true, data_list=undefined){
    const formatted_uom_orders = data_list ?? FORMATTED_UOM_ORDERS;
    formatted_uom_orders.sort((a, b) => a.subcategory_name.localeCompare(b.subcategory_name));
    formatted_uom_orders.sort((a, b) => a.category_name.localeCompare(b.category_name));
    formatted_uom_orders.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
    if (sort_latest) formatted_uom_orders.sort((a, b) => new Date(b.createdon) - new Date(a.createdon));
    
    group_arr_of_objs(formatted_uom_orders, 'request_uid').forEach(order_grouped_by_request => {
        const orders_grouped_by_vendor = group_arr_of_objs(order_grouped_by_request.grouped_objects, 'vendor_uid');
        orders_grouped_by_vendor.forEach((order_grouped_by_vendor, order_idx) => {
            const orders_grouped_by_category = group_arr_of_objs(order_grouped_by_vendor.grouped_objects, 'category_uid');
            orders_grouped_by_category.forEach((order_grouped_by_category, sub1_order_idx) => {
                const orders_grouped_by_subcategory = group_arr_of_objs(order_grouped_by_category.grouped_objects, 'subcategory_uid');                
                
                orders_grouped_by_subcategory.forEach((order_grouped_by_subcategory, sub2_order_idx) => {
                    order_grouped_by_subcategory.grouped_objects.forEach((formatted_uom_order, sub3_order_idx) => {
                        const received_quantity_input_field = formatted_uom_order.is_beyond_approved ? `<input maxlength='${String(formatted_uom_order.stock_ordered).length + 1}' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${formatted_uom_order.received_quantity}' name="product-quantity-input-field" value='${formatted_uom_order.received_quantity}'/>` : formatted_uom_order.received_quantity;
                        const correspond_order_status_obj = ORDER_STATUS_FILTER_OPTS.filter(data => data.value === formatted_uom_order.order_status_code)[0];
        
                        const order_status_selection_dropdown_markup = formatted_uom_order.is_beyond_approved ? 
                        `<ul class='dropdown-menu dropdown-menu-end' aria-labelledby='navbarDropdown' onclick='event.stopPropagation()'>
                            ${ORDER_STATUS_FILTER_OPTS.filter(data => data.selectable).map(data => `
                                <div class='dropdown-item'>
                                    <input class='form-check-input filter-opt-radio' type='radio' data-value='${data.value}' data-label='${data.label}' data-backgroundcolour='${data.colour}' data-textcolour='${data.text_color}' name='order-status-change-radio'>
                                    <label class='form-check-label'>${data.label}</label>
                                </div> 
                            `).join('<hr>\n')}
                        </ul>` : ''; 
                        
                        const order_status_selection_dropdown = `
                            <div class='opt-selection-btn' id='sort-container' style='background-color: ${correspond_order_status_obj.colour}; color: ${correspond_order_status_obj.text_color}' name='single-order-status-selection-opt-btn'>
                                <a class='nav-link' role='button' data-bs-toggle='dropdown' aria-expanded='false'>${formatted_uom_order.order_status}</a>
                                ${order_status_selection_dropdown_markup}
                            </div>
                        `;

                        const parent_target_datas = [{name: 'data-requestuid', value:  order_grouped_by_request.grouped_objects[0]['request_uid']},
                                                    {name: 'data-vendoruid', value: order_grouped_by_vendor.grouped_objects[0]['vendor_uid']},
                                                    {name: 'data-categoryuid', value: order_grouped_by_category.grouped_objects[0]['category_uid']},
                                                    {name: 'data-categoryuid', value: order_grouped_by_subcategory.grouped_objects[0]['subcategory_uid']}];
                        ORDER_HISTORY_TABLE.find('tbody').eq(0).append(`
                        <tr class='data-row' name='${ORDER_HISTORY_TABLE.attr('name')}-row'
                            data-orderuid='${formatted_uom_order.order_uid}' data-ordercode='${formatted_uom_order.order_code}' data-ordercodetrimmed='${formatted_uom_order.order_code_trimmed}'
                            data-customeruid='${formatted_uom_order.customer_uid}' data-customername='${formatted_uom_order.customer_name}'
                            data-productuid='${formatted_uom_order.product_uid}' data-productname='${formatted_uom_order.product_name}' data-productnametrimmed='${formatted_uom_order.trimmed_product_name}'
                            data-vendormapocode='${formatted_uom_order.vendor_map_code}' data-vendormapuid='${formatted_uom_order.vendor_map_uid}'
                            data-barcode='${formatted_uom_order.product_barcode}' data-brand='${formatted_uom_order.brand_name}' data-brandcode='${formatted_uom_order.brand_code}'
                            data-orderunitname='${formatted_uom_order.order_unit_name}' data-orderunitcode='${formatted_uom_order.order_unit_code}'
                            data-unitsize='${formatted_uom_order.unit_size}' data-productsize='${formatted_uom_order.product_size}'
                            data-categoryname='${formatted_uom_order.category_name}' data-categoryuid='${formatted_uom_order.category_uid}'
                            data-subcategoryname='${formatted_uom_order.subcategory_name}' data-subcategoryuid='${formatted_uom_order.subcategory_uid}'
                            data-vendorname='${formatted_uom_order.vendor_name}' data-vendoruid='${formatted_uom_order.vendor_uid}'
                            data-weekofyr='${formatted_uom_order.week_of_year_str}' data-weekofyrtrimmed='${clean_white_space(formatted_uom_order.week_of_year_str.trim().toLowerCase())}'
                            data-createdon='${formatted_uom_order.createdon}' data-createdonstr='${formatted_uom_order.createdon_str}'
                            data-refunddate='${formatted_uom_order.refund_on_dt}' data-refunddatestr='${formatted_uom_order.refund_on_str}'
                            data-payondate='${formatted_uom_order.paid_on_dt}' data-payondatestr='${formatted_uom_order.paid_on_str}'
                            data-shipeddt='${formatted_uom_order.shipped_dt}' data-shipeddtstr='${formatted_uom_order.shipped_str}'
                            data-delivereddt='${formatted_uom_order.delivered_dt}' data-delivereddtstr='${formatted_uom_order.delivered_str}'
                            data-spent='${formatted_uom_order.est_price}' data-stockordered='${formatted_uom_order.stock_ordered}'
                            data-receivedquantity='${formatted_uom_order.received_quantity}'
                            data-orderstatuscode='${formatted_uom_order.order_status_code}' data-orderstatus='${formatted_uom_order.order_status}' data-ogorderstatuscode='${formatted_uom_order.order_status_code}'
                            data-paymentstatuscode='${formatted_uom_order.payment_status_code}' data-paymentstatus='${formatted_uom_order.payment_status}'
                            data-requestuid='${formatted_uom_order.request_uid}' data-requestcode='${formatted_uom_order.request_code}'
                            data-isfirstidx='${get_sum_num_arr([order_idx, sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? 1 : 0}'
                            style='display: ${get_sum_num_arr([sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? 'table-row' : 'none'};'
                            ${make_target_data_attr_markup(parent_target_datas)}>
                            ${get_sum_num_arr([order_idx, sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? `
                            <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>
                                ${is_purchase_request_editable(order_grouped_by_request.grouped_objects) ? 
                                    make_request_status_checkbox('select-uom-request-data-checkbox-on-request', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}]) : 
                                    `<span class="material-symbols-rounded">pending</span>`}
                            </th>
                            <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>
                                ${formatted_uom_order.request_code}
                                ${make_collapse_tr_btn(0, orders_grouped_by_vendor.length, 'data-requestuid', formatted_uom_order.request_uid, 'data-requestuid', order_grouped_by_request.grouped_objects[0]['request_uid'], 3, parent_target_datas, false, orders_grouped_by_vendor.length <= 1)}
                            </th>
                            ` : ''}
                            ${get_sum_num_arr([sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? `
                            <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1' data-collapsebtncontainer='1'>
                                <span class="material-symbols-rounded" name='${OPEN_INVOICE_UPLOAD_BTN.attr('name')}'>attach_file</span>
                            </th>
                            <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1' data-collapsebtncontainer='1'>
                                ${is_purchase_request_editable(order_grouped_by_vendor.grouped_objects) ? 
                                    make_request_status_checkbox('select-uom-request-data-checkbox-on-vendor', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}, {data_name: 'data-vendoruid', data_val: formatted_uom_order.vendor_uid}]) :
                                    `<span class="material-symbols-rounded">pending</span>`}
                            </th>
                            <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1'>
                                ${formatted_uom_order.vendor_name}
                                ${make_collapse_tr_btn(1, orders_grouped_by_category.length, 'data-vendoruid', order_grouped_by_vendor.grouped_objects[0]['vendor_uid'], 'data-requestuid', order_grouped_by_request.grouped_objects[0]['request_uid'], 3, parent_target_datas, true, orders_grouped_by_category.length <= 1)}
                            </th>
                            <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1'>${get_sum_num_arr(order_grouped_by_vendor.grouped_objects.map(data => data.stock_ordered))}</th>`: 
                            `<th scope="row" rowspan="0" class='span-grouped-row hidden' data-collapseidx='1' hidden style='display: none;'></th>`}
                            ${get_sum_num_arr([sub2_order_idx, sub3_order_idx]) === 0 ? `
                            <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='2' data-collapsebtncontainer='2'>
                                ${is_purchase_request_editable(order_grouped_by_category.grouped_objects) ? 
                                    make_request_status_checkbox('select-uom-request-data-checkbox-on-category', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}, {data_name: 'data-vendoruid', data_val: order_grouped_by_vendor.grouped_objects[0]['vendor_uid']},  {data_name: 'data-categoryuid', data_val: order_grouped_by_category.grouped_objects[0]['category_uid']}]):
                                    '<span class="material-symbols-rounded">pending</span>'}
                            </th>
                            <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='2'>
                                    ${formatted_uom_order.category_name}
                                    ${make_collapse_tr_btn(2, orders_grouped_by_subcategory.length, 'data-categoryuid', order_grouped_by_category.grouped_objects[0]['category_uid'], 'data-requestuid', order_grouped_by_request.grouped_objects[0]['request_uid'], 3, parent_target_datas, true, orders_grouped_by_subcategory.length <= 1)}
                            </th>`:''
                            }
                            ${get_sum_num_arr([sub3_order_idx]) === 0 ? 
                                `<th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='3'>
                                    ${is_purchase_request_editable(order_grouped_by_subcategory.grouped_objects) ? 
                                        make_request_status_checkbox('select-uom-request-data-checkbox-on-subcategory', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}, {data_name: 'data-vendoruid', data_val: order_grouped_by_vendor.grouped_objects[0]['vendor_uid']},  {data_name: 'data-categoryuid', data_val: order_grouped_by_category.grouped_objects[0]['category_uid']}, {data_name: 'data-subcategoryuid', data_val: order_grouped_by_subcategory.grouped_objects[0]['subcategory_uid']}]) :
                                        '<span class="material-symbols-rounded">pending</span>'}
                                </th>
                                <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='3'>
                                    ${formatted_uom_order.subcategory_name}
                                    ${make_collapse_tr_btn(3, order_grouped_by_subcategory.grouped_objects.length, 'data-subcategoryuid', order_grouped_by_subcategory.grouped_objects[0]['subcategory_uid'], 'data-requestuid', order_grouped_by_subcategory.grouped_objects[0]['request_uid'], 3, parent_target_datas, true, order_grouped_by_subcategory.grouped_objects.length <= 1)}
                                </th>`:''
                            }
                            <td scope="row">
                                <div class='image-container' name='product-info-btn'>
                                    <img src='${formatted_uom_order.thumbnail_img}'/>
                                </div>
                            </td>
                            <td scope="row">${formatted_uom_order.vendor_map_code}</td>
                            <td scope="row">${formatted_uom_order.product_name}</td>
                            <td scope="row">${formatted_uom_order.stock_ordered}</td>
                            <td scope="row">${received_quantity_input_field}</td>
                            <td scope="row">${formatted_uom_order.unit_size} ${formatted_uom_order.order_unit_name}</td>
                            <td scope="row" style='font-weight: 500;'>$${formatted_uom_order.est_price.toFixed(2)}</td>
                            <td scope="row">${order_status_selection_dropdown}</td>
                            <td scope="row">${formatted_uom_order.payment_status}</td>
                            <td scope="row">${formatted_uom_order.createdon_str}</td>
                            <td hidden scope='row'><textarea class='product-remark-container' disabled hidden>${formatted_uom_order.product_remark}</textarea></td>
                        </tr>`);
                    });
                });
            });
            order_grouped_by_vendor.grouped_objects.forEach((formatted_uom_order, sub1_order_idx) => {
                
            });
        });
    });
}

function render_body_content(){
    $.ajax({
        type: 'POST',
        url: 'https://prod-30.australiasoutheast.logic.azure.com:443/workflows/ddf66dfe3a30480b82d1fa09aa287d66/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BDEBe_lroZHou_5EJJydWVazvwXtpWo54Z7w61IpNFs',
        contentType: 'application/json',
        accept: 'application/json;odata=verbose',
        timeout: AJAX_TIMEOUT_DURATION,
        data: JSON.stringify({'user_uid': CUSTOMER_UID}),
        complete: function(response, status, xhr){
            if (String(status) !== 'success'){
                alert('Unable to load data at this time');
                return window.location = `${window.location.origin}/No-Data/`;
                return hide_elems_on_load(true);
            }
            const uom_requests = response['responseJSON'];
            const num_orders = get_sum_num_arr(response['responseJSON'].map(uom_request => uom_request.crcfc_num_orders));

            if (uom_requests.length < 1 || num_orders < 1) return window.location = `${window.location.origin}/No-Data/`;

            $('div[name=spinner-resource-loader-container]').hide();
            $('div[name=progress-resource-loader-container]').show();
            let idx = 0;

            function retrieve_uom_orders(uom_request){
                function assign_ordered_product_info(product, formatted_uom_order){
                    formatted_uom_order['order_unit_code'] = product.prg_orderunit;
                    formatted_uom_order['order_unit_name'] = product['prg_orderunit@OData.Community.Display.V1.FormattedValue'];
                    formatted_uom_order['product_size'] = is_json_data_empty(product.prg_productsize) ? '' : product.prg_productsize;
                    formatted_uom_order['unit_size'] = product.prg_unitsize;
                    formatted_uom_order['category_uid'] = product['prg_category'];
                    formatted_uom_order['category_name'] = product['prg_category@OData.Community.Display.V1.FormattedValue'];
                    formatted_uom_order['subcategory_uid'] = product['prg_subcategory'];
                    formatted_uom_order['subcategory_name'] = product['prg_subcategory@OData.Community.Display.V1.FormattedValue'];
                    formatted_uom_order['brand_code'] = is_json_data_empty(product['prg_brand']) ? -1 : product['prg_brand'];
                    formatted_uom_order['brand_name'] = is_json_data_empty(product['prg_brand@OData.Community.Display.V1.FormattedValue']) ? 'No Brand' : product['prg_brand@OData.Community.Display.V1.FormattedValue'];
                    formatted_uom_order['trimmed_product_name'] = clean_white_space(product.prg_name.trim().toLowerCase());
                    formatted_uom_order['product_barcode'] = is_json_data_empty(product.prg_unitbarcodes) ? '' : product.prg_unitbarcodes;
                    formatted_uom_order['thumbnail_img'] = covert_product_b64_img_to_url(product.crcfc_img_content_mime_type, product.crcfc_img_content);
                    formatted_uom_order['product_remark']= product.prg_remarks ?? '';
                    formatted_uom_order['bulk_order_unit_code'] = is_json_data_empty(product.prg_bulkorder) ? 0 : product.prg_bulkorder;
                    formatted_uom_order['bulk_order_unit_name'] = is_json_data_empty(product.prg_bulkorder) ? 'N/A' : product['prg_bulkorder@OData.Community.Display.V1.FormattedValue'];
                    // Only append valid order with a formatted est price
                    if (formatted_uom_order.est_price > 0) FORMATTED_UOM_ORDERS.push(formatted_uom_order);
                }

                function _finalise_request(incr=true){
                    let is_loop = idx < num_orders - 1;
                    render_loading_progress_bar(is_loop ? (100 * idx) / num_orders : 99.9);
                    if (is_loop) return incr ? idx++ : idx;
                    if (FORMATTED_UOM_ORDERS.length < 1) return window.location = `${window.location.origin}/No-Data/`;

                    sleep(10000);
                    ORDER_STATUS_FILTER_OPTS.filter(data => data.selectable).forEach(data => {
                        $('div[name=mass-order-status-selection-opt-container]').append(`
                            <div class='filter-container opt-selection-btn' id='sort-container' style='background-color: ${data.colour}; color: ${data.text_color}'
                                name='mass-order-status-selection-opt-btn' data-value='${data.value}' data-label='${data.label}'>
                                <a class='nav-link' data-bs-toggle='dropdown' aria-expanded='false'>${data.label}</a>
                            </div>
                        `);
                    });
                    FORMATTED_UOM_ORDERS.forEach(uom_order => {
                        if (brand_filter_options.length < 0 || !brand_filter_options.map(item => item.value).includes(uom_order.brand_code)) brand_filter_options.push({'value': uom_order.brand_code, 'label': uom_order.brand_name});
                        if (product_filter_options.length < 0 || !product_filter_options.map(item => item.value).includes(uom_order.product_uid)) product_filter_options.push({'value': uom_order.product_uid, 'label': uom_order.product_name});
                        if (subcategory_filter_options.length < 0 || !subcategory_filter_options.map(item => item.value).includes(uom_order.subcategory_uid)) subcategory_filter_options.push({'value': uom_order.subcategory_uid, 'label': uom_order.subcategory_name});
                        if (category_filter_options.length < 0 || !category_filter_options.map(item => item.value).includes(uom_order.category_uid)) category_filter_options.push({'value': uom_order.category_uid, 'label': uom_order.category_name});
                        if (vendor_filter_options.length < 0 || !vendor_filter_options.map(item => item.value).includes(uom_order.vendor_uid)) vendor_filter_options.push({'value': uom_order.vendor_uid, 'label': uom_order.vendor_name});
                        if (week_of_yr_data.length < 0 || !week_of_yr_data.map(item => item.value).includes(uom_order.week_of_year_str)) week_of_yr_data.push({'value': uom_order.week_of_year_str, 'label': uom_order.week_of_year_str});
                    });

                    const {min, max} = get_min_max_from_dt_arr(FORMATTED_UOM_ORDERS.map(uom_order => uom_order.createdon));
                    set_up_date_range_picker(ORDER_DATE_FILTER_DROPDOWN, min, max);

                    render_filter_options(BRAND_FILTER_DROPDOWN, brand_filter_options);
                    render_filter_options(PRODUCT_FILTER_DROPDOWN, product_filter_options, true);
                    render_filter_options(CATEGORY_FILTER_DROPDOWN, category_filter_options);
                    render_filter_options(SUBCATEGORY_FILTER_DROPDOWN, subcategory_filter_options);
                    render_filter_options(VENDOR_FILTER_DROPDOWN, vendor_filter_options);
                    render_filter_options(ORDER_STATUS_FILTER_DROPDOWN, ORDER_STATUS_FILTER_OPTS);
                    render_filter_options(PAYMENT_STATUS_FILTER_DROPDOWN, PAYMENT_STATUS_FILTER_OPTS);

                    render_chart_js_content();
                    render_order_history_data_row();
                    hide_elems_on_load(true);
                    $('#sort-by-createdon-desc').prop('checked', true);
                    disable_filter_elements();
                }

                function format_uom_order(uom_order){
                    const request_createdon_dt = new Date(uom_request.createdon) ;
                    const is_request_createdon_within_one_month = request_createdon_dt >= ONE_MONTH_AGO;
                    let formatted_uom_order = {
                        'order_code': `${uom_request.crcfc_requestcode}-${uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue']}`,
                        'order_code_trimmed': clean_white_space(`${uom_request.crcfc_requestcode}-${uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue']}`.trim().toLowerCase()),
                        'order_uid': uom_order.prg_uomprocurementorderid,
                        'vendor_map_uid': uom_order['_prg_vendorcode_value'],
                        'vendor_map_code': uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue'],
                        'request_uid': uom_request.crcfc_uomprocurementorderrequestid,
                        'request_odataid': uom_order['@odata.id'],
                        'request_code': uom_request.crcfc_requestcode,
                        'createdon_str': format_dt(request_createdon_dt),
                        'createdon': request_createdon_dt,
                        'vendor_name': uom_order['_prg_vendor_value@OData.Community.Display.V1.FormattedValue'],
                        'vendor_uid': uom_order['_prg_vendor_value'],
                        'product_name': uom_order['_prg_product_value@OData.Community.Display.V1.FormattedValue'],
                        'product_uid': uom_order['_prg_product_value'],
                        'est_price': uom_order['crcfc_est_price'],
                        'stock_ordered': uom_order.prg_stockordered,
                        'received_quantity': uom_order.crcfc_received_quantity,
                        'payment_status_code': uom_order.crcfc_paymentstatus,
                        'payment_status': uom_order['crcfc_paymentstatus@OData.Community.Display.V1.FormattedValue'],
                        'order_status_code': uom_order['prg_orderstatus'],
                        'order_status': uom_order['prg_orderstatus@OData.Community.Display.V1.FormattedValue'],
                        'paid_on_dt': uom_order.crcfc_paidon,
                        'paid_on_str': is_json_data_empty(uom_order.crcfc_paidon) ? '_' : format_dt(new Date(uom_order.crcfc_paidon)),
                        'refund_on_dt': uom_order.crcfc_refundedon,
                        'refund_on_str': is_json_data_empty(uom_order.crcfc_refundedon) ? '_' : format_dt(new Date(uom_order.crcfc_refundedon)),
                        'shipped_dt': uom_order.crcfc_shippeddate,
                        'shipped_str': is_json_data_empty(uom_order.crcfc_shippeddate) ? '_' : format_dt(new Date(uom_order.crcfc_shippeddate)),
                        'delivered_dt': uom_order.crcfc_delivereddate,
                        'delivered_str': is_json_data_empty(uom_order.crcfc_delivereddate) ? '_' : format_dt(new Date(uom_order.crcfc_delivereddate)),
                        'customer_uid': uom_order['_prg_customer_value'],
                        'customer_name': uom_order['_prg_customer_value@OData.Community.Display.V1.FormattedValue'],

                        'is_beyond_approved': APPROVED_ORDER_STATUS_CODES.includes(uom_order['prg_orderstatus']) && is_request_createdon_within_one_month,
                        'allow_ticket_raised': ELIGIBLE_TICKET_STATUS_CODES.includes(uom_order['prg_orderstatus']) && is_request_createdon_within_one_month,
                        'week_of_year_str': date_to_week_str(uom_order.createdon),
                    };
                    assign_ordered_product_info(format_obj_prg_key(extract_sub_object({...uom_order}, 'ordered_product.')), formatted_uom_order);
                    _finalise_request(true);
                }

                $.ajax({
                    type: 'POST',
                    url: 'https://prod-12.australiasoutheast.logic.azure.com:443/workflows/bbfaafb06d9e49e3ae637509aa3cf6a7/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=x0w-BX1hGK46OMvEez2FFhSXb9QEcR33PzVR9Gz519U',
                    contentType: 'application/json',
                    accept: 'application/json;odata=verbose',
                    async: true,
                    timeout: AJAX_TIMEOUT_DURATION,
                    data: JSON.stringify({'request_uid': uom_request['crcfc_uomprocurementorderrequestid']}),
                    complete: function(response, status, xhr){
                        if (String(status) !== 'success') return _finalise_request(false);
                        const uom_orders = response['responseJSON'];
                        if (uom_orders.length < 1) return _finalise_request(false);
                        uom_orders.forEach(uom_order => {
                            format_uom_order(uom_order);
                        });
                    }
                });
            }

            render_loading_progress_bar(0);
            uom_requests.forEach(uom_request => {
                (function(y) {
                    setTimeout(function() {
                        retrieve_uom_orders(uom_request);
                        }, y * 80);
                    }(idx));
            });
            
        },
    });
}


function render_chart_js_content(no_filter=true){
    const _min_height_enfore = `style='min-height: 500px !important;'`
    $('section[name=order-stat-container-section]').find('.removable-item').each(function(){
        $(this).remove();
    });

    const filtered_vendors = get_selected_filter_values(`${VENDOR_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_products = get_selected_filter_values(`${PRODUCT_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_categories = get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_subcategories = get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_brands = get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_payment_opts = get_selected_filter_values(`${PAYMENT_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
    const filtered_order_opts = get_selected_filter_values(`${ORDER_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
    let {min_date, max_date} = get_daterange_input_val(ORDER_DATE_FILTER_DROPDOWN);
    const filtered_week_of_year_arr = get_weeks_in_range(min_date, max_date);
    const searched_txt = !$('input[name=product-search-input-field]').val() || is_whitespace($('input[name=product-search-input-field]').val()) ? '' : clean_white_space($('input[name=product-search-input-field]').val().toLowerCase().trim());

    const filtered_uom_orders = no_filter ? FORMATTED_UOM_ORDERS : FORMATTED_UOM_ORDERS.filter(uom_order => 
        (uom_order.trimmed_product_name.includes(searched_txt) || uom_order.order_code_trimmed.includes(searched_txt)) &&
        filtered_subcategories.includes(uom_order.subcategory_uid) && filtered_categories.includes(uom_order.category_uid) &&
        filtered_products.includes(uom_order.product_uid) &&
        filtered_vendors.includes(uom_order.vendor_uid) &&
        filtered_brands.includes(String(uom_order.brand_code)) &&
        filtered_payment_opts.includes(uom_order.payment_status_code) &&
        filtered_order_opts.includes(uom_order.order_status_code) &&
        is_within_datetime_range(uom_order.createdon, min_date, max_date)
    );
    $('div[name=num-total-order-txt-container]').find('span').eq(0).text(` ${filtered_uom_orders.length}`);

    const order_status_stat_canvas = `<canvas id='order_status_stat_canvas' class='pm-stat-item'></canvas>`;
    PAYMENT_ORDER_STATUS_STAT_CONTAINER.append(`
    <div class='stat-item-container removable-item'>
        ${order_status_stat_canvas}
    </div>
    `);
    new Chart(document.getElementById('order_status_stat_canvas'), {
        type: 'doughnut',
        data: {
            labels: ORDER_STATUS_FILTER_OPTS.map(item => item.label),
            datasets: [{
                label: 'Number of orders:',
                data: ORDER_STATUS_FILTER_OPTS.map(item => filtered_uom_orders.filter(uom_order => uom_order.order_status_code === item.value).length),
                backgroundColor: ORDER_STATUS_FILTER_OPTS.map(item => item.colour),
                hoverOffset: 4
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Order Status'
                }
            },

        }
    });
    const payment_status_stat_canvas = `<canvas id='payment_status_stat_canvas' class='pm-stat-item' style='min-height: 500px !important;'></canvas>`;
    PAYMENT_ORDER_STATUS_STAT_CONTAINER.append(`
    <div class='stat-item-container removable-item'>
        ${payment_status_stat_canvas}
    </div>
    `);
    new Chart(document.getElementById('payment_status_stat_canvas'), {
        type: 'doughnut',
        data: {
            labels: PAYMENT_STATUS_FILTER_OPTS.map(item => item.label),
            datasets: [{
                label: 'Number of orders:',
                data: PAYMENT_STATUS_FILTER_OPTS.map(item => filtered_uom_orders.filter(uom_order => uom_order.payment_status_code === item.value).length),
                backgroundColor: PAYMENT_STATUS_FILTER_OPTS.map(item => item.colour),
                hoverOffset: 4
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Payment Status'
                }
            },

        }
    });

    const vendor_order_quantity_canvas = `<canvas id='vendor_order_quantity_canvas' class='pm-stat-item'></canvas>`;
    VENDOR_ORDER_STAT_CONTAINER.append(`
    <div class='stat-item-container removable-item'>
        ${vendor_order_quantity_canvas}
    </div>
    `);
    new Chart(document.getElementById('vendor_order_quantity_canvas'), {
        type: 'bar',
        data: {
            labels: vendor_filter_options.map(item => item.label),
            datasets: [
                {
                    label: 'Amount Spent (in AUD)',
                    data: vendor_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.vendor_uid === item.value).map(uom_order => uom_order.est_price), 2)),
                    backgroundColor: ['#84BD00'],
                    borderColor: ['#84BD00'],
                    fill: false,
                    hoverOffset: 4,
                    type: 'line',
                    yAxisID: 'spent',
                    
                },
                {
                    label: 'Stock Received',
                    data: vendor_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.vendor_uid === item.value).map(uom_order => uom_order.received_quantity))),
                    hoverOffset: 4,
                    backgroundColor: ['#0067B9'],
                    borderColor: ['#0067B9'],
                    type: 'bar',
                    yAxisID: 'quantity',
                },
                {
                    label: 'Stock Ordered',
                    data: vendor_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.vendor_uid === item.value).map(uom_order => uom_order.stock_ordered))),
                    hoverOffset: 4,
                    backgroundColor: ['#bfd9ee'],
                    borderColor: ['#bfd9ee'],
                    type: 'bar',
                    yAxisID: 'quantity',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Vendors'
                },
                colors: {enabled: true,} //Auto colour
            },
            scales: {
                spent: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'right',
                    y: {
                        title: {
                            display: true,
                            text: 'Amount Spent in AUD'
                        },
                      },
                },
                quantity:{
                    //stacked: true,
                    beginAtZero: true,
                    position: 'left',
                    y: {
                        title: {
                            display: true,
                            text: 'Stock Ordered'
                        },
                      },
                },
                x: {
                //stacked: true,
                  grid: {
                    display:false,  // hide vertical grid lines
                  },
                },
              }
        }
    });

    const category_order_quantity_canvas = `<canvas id='category_order_quantity_canvas' class='pm-stat-item'></canvas>`;
    CATEGORY_ORDER_STAT_CONTAINER.append(`
    <div class='stat-item-container removable-item'>
        ${category_order_quantity_canvas}
    </div>
    `);
    new Chart(document.getElementById('category_order_quantity_canvas'), {
        type: 'bar',
        data: {
            labels: category_filter_options.map(item => item.label),
            datasets: [
                {
                    label: 'Amount Spent (in AUD)',
                    data: category_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.category_uid === item.value).map(uom_order => uom_order.est_price), 2)),
                    backgroundColor: ['#3D3935'],
                    borderColor: ['#3D3935'],
                    hoverOffset: 4,
                    type: 'line',
                    yAxisID: 'spent',
                    
                },
                {
                    label: 'Stock Ordered',
                    data: category_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.category_uid === item.value).map(uom_order => uom_order.stock_ordered))),
                    hoverOffset: 4,
                    backgroundColor: ['#86919f'],
                    borderColor: ['#86919f'],
                    type: 'bar',
                    yAxisID: 'quantity',
                }],
        },
        options: {
            responsive: true,
            //maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Categories'
                },
                colors: {enabled: true,} //Auto colour
            },
            scales: {
                spent: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'right',
                    y: {
                        title: {
                            display: true,
                            text: 'Amount Spent in AUD'
                        },
                      },
                },
                quantity:{
                    beginAtZero: true,
                    position: 'left',
                    y: {
                        title: {
                            display: true,
                            text: 'Stock Ordered'
                        },
                      },
                },
                x: {
                  grid: {
                    display:false,  // hide vertical grid lines
                  },
                },
              }
        }
    });

    const subcategory_order_quantity_canvas = `<canvas id='subcategory_order_quantity_canvas' class='pm-stat-item'></canvas>`;
    SUBCATEGORY_ORDER_STAT_CONTAINER.append(`
    <div class='stat-item-container removable-item'>
        ${subcategory_order_quantity_canvas}
    </div>
    `);
    new Chart(document.getElementById('subcategory_order_quantity_canvas'), {
        type: 'bar',
        data: {
            labels: subcategory_filter_options.map(item => item.label),
            datasets: [
                {
                    label: 'Amount Spent (in AUD)',
                    data: subcategory_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.subcategory_uid === item.value).map(uom_order => uom_order.est_price), 2)),
                    backgroundColor: ['#F57F25'],
                    borderColor: ['#F57F25'],
                    hoverOffset: 4,
                    type: 'line',
                    yAxisID: 'spent',
                    
                },
                {
                    label: 'Stock Ordered',
                    data: subcategory_filter_options.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.subcategory_uid === item.value).map(uom_order => uom_order.stock_ordered))),
                    hoverOffset: 4,
                    backgroundColor: ['#ebef92'],
                    borderColor: ['#ebef92'],
                    type: 'bar',
                    yAxisID: 'quantity',
                }],
        },
        options: {
            responsive: true,
            //maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Subcategories'
                },
                colors: {enabled: true,} //Auto colour
            },
            scales: {
                spent: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'right',
                    y: {
                        title: {
                            display: true,
                            text: 'Amount Spent in AUD'
                        },
                      },
                },
                quantity:{
                    beginAtZero: true,
                    position: 'left',
                    y: {
                        title: {
                            display: true,
                            text: 'Stock Ordered'
                        },
                      },
                },
                x: {
                  grid: {
                    display:false,  // hide vertical grid lines
                  },
                },
              }
        }
    });

    const week_of_year_order_stat_canvas = `<canvas id='week_of_year_order_stat_canvas' class='pm-stat-item'></canvas>`;
    WEEK_OF_YR_ORDER_STAT_CONTAINER.append(`
    <div class='stat-item-container removable-item'>
        ${week_of_year_order_stat_canvas}
    </div>
    `);
    new Chart(document.getElementById('week_of_year_order_stat_canvas'), {
        type: 'bar',
        data: {
            labels: week_of_yr_data.map(item => item.label),
            datasets: [
                {
                    label: 'Amount Spent (in AUD)',
                    data: week_of_yr_data.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.week_of_year_str === item.value && filtered_week_of_year_arr.includes(uom_order.week_of_year_str)).map(uom_order => uom_order.est_price), 2)),
                    backgroundColor: ['#0c2340'],
                    borderColor: ['#0c2340'],
                    hoverOffset: 4,
                    type: 'line',
                    yAxisID: 'spent',
                    
                },
                {
                    label: 'Stock Received',
                    data: week_of_yr_data.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.week_of_year_str === item.value && filtered_week_of_year_arr.includes(uom_order.week_of_year_str)).map(uom_order => uom_order.received_quantity))),
                    hoverOffset: 4,
                    backgroundColor: ['#FA0A76'],
                    borderColor: ['#FA0A76'],
                    type: 'bar',
                    yAxisID: 'quantity',
                },
                {
                    label: 'Stock Ordered',
                    data: week_of_yr_data.map(item => get_sum_num_arr(filtered_uom_orders.filter(uom_order => uom_order.week_of_year_str === item.value && filtered_week_of_year_arr.includes(uom_order.week_of_year_str)).map(uom_order => uom_order.stock_ordered))),
                    hoverOffset: 4,
                    backgroundColor: ['#d780c7'],
                    borderColor: ['#d780c7'],
                    type: 'bar',
                    yAxisID: 'quantity',
                }],
        },
        options: {
            responsive: true,
            //maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Weeks'
                },
                colors: {enabled: true,} //Auto colour
            },
            scales: {
                spent: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'right',
                    y: {
                        title: {
                            display: true,
                            text: 'Amount Spent in AUD'
                        },
                      },
                },
                quantity:{
                    beginAtZero: true,
                    position: 'left',
                    y: {
                        title: {
                            display: true,
                            text: 'Stock Ordered'
                        },
                      },
                },
                x: {
                  grid: {
                    display:false,  // hide vertical grid lines
                  },
                },
              }
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

function sort_order_history_items(sort_radio_dom, formatted_uom_orders, render_table=false){
    const _this_id = sort_radio_dom.attr('id');
    const _data_row = $(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
    if (formatted_uom_orders.length < 1) return;

    if (_this_id == 'sort-by-product-name-asc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => a.product_name.localeCompare(b.product_name));
    }else if (_this_id == 'sort-by-product-name-desc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => b.product_name.localeCompare(a.product_name));
    }else if(_this_id == 'sort-by-price-asc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => parseFloat(a.est_price) - parseFloat(b.est_price));
    }else if(_this_id == 'sort-by-price-desc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => parseFloat(b.est_price) - parseFloat(a.est_price));
    }else if(_this_id == 'sort-by-quantity-asc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => parseInt(a.stock_ordered) - parseInt(b.stock_ordered));
    }else if(_this_id == 'sort-by-quantity-desc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => parseInt(b.stock_ordered) - parseInt(a.stock_ordered));
    }else if(_this_id == 'sort-by-createdon-desc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => new Date(b.createdon) - new Date(a.createdon));
    }else if(_this_id == 'sort-by-createdon-asc'){
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => new Date(a.createdon) - new Date(b.createdon));
    }else if (_this_id == 'sort-by-product-code-asc') {
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => a.vendor_map_code.localeCompare(b.vendor_map_code));
    }else if (_this_id == 'sort-by-product-code-desc') {
        formatted_uom_orders = formatted_uom_orders.sort((a, b) => b.vendor_map_code.localeCompare(a.vendor_map_code));
    }
    if (render_table){
        _data_row.each(function(){
            $(this).remove();
        });
        render_order_history_data_row(_this_id == 'sort-by-createdon-desc', formatted_uom_orders);
    }
}

// Order detail changes function
function process_order_status_opt_selection_btn(parent_tr, correspond_order_status_obj){
    const order_status_selection_btn = parent_tr.find('div[name=single-order-status-selection-opt-btn]').eq(0);
    order_status_selection_btn.find('.nav-link').text(correspond_order_status_obj.label);
    order_status_selection_btn.css('background-color', correspond_order_status_obj.colour);
    order_status_selection_btn.css('color', correspond_order_status_obj.text_color);

    parent_tr.attr('data-orderstatuscode', correspond_order_status_obj.value);
    parent_tr.attr('data-orderstatus', correspond_order_status_obj.label);
}

function process_order_status_opt_selection_input_field_val(parent_tr, correspond_order_status_obj){
    const stock_ordered = parseInt(parent_tr.attr('data-stockordered'));
    const par_recived_quantity = parseInt(parent_tr.find('input[name=product-quantity-input-field]').val());
    const og_received_quantity = parseInt(parent_tr.find('input[name=product-quantity-input-field]').attr('placeholder'));

    if (correspond_order_status_obj.value === 4){
        // Received in Full
        parent_tr.attr('data-receivedquantity', stock_ordered);
        parent_tr.find('input[name=product-quantity-input-field]').val(stock_ordered);
    }else if (correspond_order_status_obj.value === 5) {
        // Partially Received 
        let new_quantity = Math.min(...[stock_ordered, par_recived_quantity, og_received_quantity]);
        if (new_quantity >= stock_ordered){
            new_quantity = stock_ordered - 1;
        }else{
            if (par_recived_quantity < stock_ordered){
                new_quantity = par_recived_quantity;
            }else if (og_received_quantity < stock_ordered){
                new_quantity = og_received_quantity;
            }
        }
        parent_tr.attr('data-receivedquantity', new_quantity);
        parent_tr.find('input[name=product-quantity-input-field]').val(new_quantity);
    }

    process_order_status_opt_selection_btn(parent_tr, correspond_order_status_obj);
}


$(document).ready(function(){
    hide_elems_on_load();
    render_body_content();

    //Filter function
    $(document).on('keyup change', `${product_filter_checkbox_func_names}, input[name=sort-option-radio-checkbox], input[name=product-search-input-field], .search-text-field.filter-search-text-field`, function(event){
        let no_filter = true;
        FILTER_DROPDOWNS.forEach(dropdown => {
            no_filter = no_filter && $(`input[name=${dropdown.attr('name')}-checkbox]:checked`).length < 1;
        });
        disable_button(APPLY_FILTER_BTN, !$('input[name=product-search-input-field]').val() && $('input[name=sort-option-radio-checkbox]:checked').length < 1 && no_filter);
        disable_button(CLEAR_FILTER_BTN, APPLY_FILTER_BTN.prop('disabled'));
    });

    APPLY_FILTER_BTN.on('click', function(event){
        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, true, BSTR_BORDER_SPINNER);

        const filtered_vendors = get_selected_filter_values(`${VENDOR_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_products = get_selected_filter_values(`${PRODUCT_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_categories = get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_subcategories = get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_brands = get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_payment_opts = get_selected_filter_values(`${PAYMENT_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
        const filtered_order_opts = get_selected_filter_values(`${ORDER_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);

        const searched_txt = !$('input[name=product-search-input-field]').val() || is_whitespace($('input[name=product-search-input-field]').val()) ? '' : clean_white_space($('input[name=product-search-input-field]').val().toLowerCase().trim());
        let {min_date, max_date} = get_daterange_input_val(ORDER_DATE_FILTER_DROPDOWN);
        sort_order_history_items($('input[name=sort-option-radio-checkbox]:checked'), 
                                    [...FORMATTED_UOM_ORDERS].filter(formatted_uom_order => 
                                        (formatted_uom_order.trimmed_product_name.includes(searched_txt) || formatted_uom_order.order_code_trimmed.includes(searched_txt)) &&
                                        filtered_vendors.includes(formatted_uom_order.vendor_uid) &&
                                        filtered_categories.includes(formatted_uom_order.category_uid) &&
                                        filtered_subcategories.includes(formatted_uom_order.subcategory_uid) &&
                                        filtered_products.includes(formatted_uom_order.product_uid) &&
                                        filtered_brands.includes(String(formatted_uom_order.brand_code)) &&
                                        filtered_payment_opts.includes(formatted_uom_order.payment_status_code) &&
                                        filtered_order_opts.includes(formatted_uom_order.order_status_code) &&
                                        is_within_datetime_range(formatted_uom_order.createdon, min_date, max_date)
                                    ), 
                                    true);

        render_chart_js_content(false);
        disable_button(CLEAR_FILTER_BTN, false);
        disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        disable_button(CLEAR_FILTER_BTN, true, BSTR_BORDER_SPINNER);
        disable_button(APPLY_FILTER_BTN, true);

        ORDER_HISTORY_TABLE.find('.data-row').each(function(){
            $(this).toggle(true);
        });
        sort_order_history_items($('#sort-by-createdon-desc'), FORMATTED_UOM_ORDERS, true);
        render_chart_js_content();

        $('input[name=product-search-input-field]').val(null);
        $(document).find('.form-check-input').prop('checked', false);
        $(document).find('.form-check-input').attr('checked', false);
        ORDER_DATE_FILTER_DROPDOWN.val(`${parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('min')), true)} - ${parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('max')), true)}`);

        $('#sort-by-createdon-desc').prop('checked', true);
        disable_button(CLEAR_FILTER_BTN, true, 'Clear Filters');
    });

    ORDER_DATE_FILTER_DROPDOWN.daterangepicker({
        opens: 'left'
      }, function(start, end, label) {
        ORDER_DATE_FILTER_DROPDOWN.attr('data-start', start.format('DD/MM/YYYY'));
        ORDER_DATE_FILTER_DROPDOWN.attr('data-end', end.format('DD/MM/YYYY'));
        ORDER_DATE_FILTER_DROPDOWN.val(`${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`);
        disable_button(APPLY_FILTER_BTN, false);
        disable_button(CLEAR_FILTER_BTN, APPLY_FILTER_BTN.prop('disabled'));
    });

    DATE_RANGE_PICKER_CLASS.on('keyup change', function(event){
        $(this).val(`${$(this).attr('data-start')} - ${$(this).attr('data-end')}`);
    });


    // Modal functions
    $(document).on('click', '.close-modal-btn', function(event){
        if ($('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1' || UPLOAD_FILE_BTN.attr('data-sendingrequest') === '1') return;
        $(this).closest('.modal').modal('hide');
    });


    // Upload order attachment function
    $(document).on('click', `span[name=${OPEN_INVOICE_UPLOAD_BTN.attr('name')}]`, function(event){
        const parent_card = $(this).closest('tr');
        const parent_th = $(this).closest('.span-grouped-row');
        targeted_uom_order = FORMATTED_UOM_ORDERS.filter(uom_order => uom_order.order_uid === parent_card.attr('data-orderuid'))[0];
        if (targeted_uom_order === undefined) return;
        FILE_DOWNLOAD_LINK = undefined;
        $(`h6[name=upload-img-name-txt-container]`).empty();
        _wait_for_file_retrieval(parent_th);
        UPLOAD_INVOICE_MODAL.find('.modal-title').text(`Upload vendor ${targeted_uom_order.vendor_name} invoice for Request ${targeted_uom_order.request_code}`);
        ajax_retrieve_invoice(parent_th);
    });

    $(document).on('click', `button[name=${DOWNLOAD_FILE_BTN.attr('name')}]`, function(event){
        if (FILE_DOWNLOAD_LINK === undefined || targeted_uom_order === undefined) return;
        FILE_DOWNLOAD_LINK.click();
    });

    $(document).on('change', `input[name=${UPLOAD_INVOICE_FIELD.attr('name')}]`, function(event){
        if (targeted_uom_order === undefined) return;
        const files = document.getElementById($(this).attr('id')).files;
        if (files.length < 1) return;
        is_b64_str_longer_than_allowed(files[0], function(exceed){
            disable_button(UPLOAD_FILE_BTN, exceed);
            if (exceed) {
                UPLOAD_INVOICE_FIELD.val(null);
                $(`h6[name=upload-img-name-txt-container]`).empty();
                return alert('File size larger than allowed');
            }
            $(`h6[name=upload-img-name-txt-container]`).text(files[0].name);
        });
    });

    UPLOAD_FILE_BTN.on('click', async function(event){
        if (targeted_uom_order === undefined || !UPLOAD_INVOICE_FIELD.val()) return disable_button($(this), true);
        const uploaded_file = document.getElementById(UPLOAD_INVOICE_FIELD.attr('id')).files[0];
        if (uploaded_file === undefined) return disable_button($(this), true);
        _await_file_upload();
        try{
            const b64_content = get_base64_contents(await convert_to_base64(uploaded_file));
            $.ajax({
                type: 'POST',
                url: 'https://prod-05.australiasoutheast.logic.azure.com:443/workflows/69e09af6a32c4b8ba2fd2fda8ddb5a85/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RGqAfTWZ7L4d5LXvowFFfzzU9CPhilbrcqO2oiHjjWQ',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({
                    'file_name': uploaded_file.name,
                    'b64_encode': b64_content[1],
                    'size': b64_content[1].length,
                    'mime_type': b64_content[0],
                    'vendor_odataid': '',
                    'vendor_uid': targeted_uom_order.vendor_uid,
                    'request_odataid': targeted_uom_order.request_odataid,
                    'request_uid': targeted_uom_order.request_uid,
                }),
                complete: function(response, status, xhr){
                    UPLOAD_INVOICE_FIELD.val(null);
                },
                success: function(response, status, xhr){
                    ajax_retrieve_invoice();
                },
                error: function(response, status, xhr){
                    alert('Error uploading file');
                    _await_file_upload(true);
                },
            });
            
        }catch (error){
            console.error(error);
            alert('Error reading file');
            _await_file_upload(true);
        }
    });
    

    //Product Info Button function
    $(document).on('click', 'div[name=product-info-btn]', function(){
        if ($('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        const parent_card = $(this).closest('tr');
        targeted_uom_order = FORMATTED_UOM_ORDERS.filter(uom_order => uom_order.order_uid === parent_card.attr('data-orderuid'))[0];
        if (targeted_uom_order === undefined) return;
        const payment_status_code = parseInt(parent_card.attr('data-paymentstatuscode'));

        let latest_payment_update_date = parent_card.attr('data-payondatestr');
        if (payment_status_code === 2) latest_payment_update_date = parent_card.attr('data-refunddatestr');

        const is_shiped = targeted_uom_order.shipped_dt !== undefined && targeted_uom_order.shipped_dt instanceof Date;
        const is_delivered = targeted_uom_order.delivered_dt !== undefined && targeted_uom_order.delivered_dt instanceof Date;
        $('div[name=product-info-modal]').find('.modal-title').text(parent_card.attr('data-productname'));
        $('div[name=product-info-modal]').find('.modal-body').empty();
        $('div[name=product-info-modal]').find('.modal-footer').empty();

        if (targeted_uom_order.allow_ticket_raised) {
            $('div[name=product-info-modal]').find('.modal-footer').append(`
            <button type='button' class='btn btn-primary' name='cancel-order-btn' data-btnlabel='Cancel Order'>Cancel Order</button>
            <button type='button' class='btn btn-primary' name='request-return-order-btn' data-btnlabel='Issue Return'>Issue Return</button>
            <button type='button' class='btn btn-primary' name='st-wrong-order-btn' data-btnlabel='Other Issues'>Other Issues</button>
            `);
        }

        $('div[name=product-info-modal]').find('.modal-footer').find('button').attr('disabled', targeted_uom_order === undefined);

        $('div[name=product-info-modal]').find('.modal-body').append(`
            <div style='position: relative; overflow: hidden; width: 100%; height: auto; max-width: 250px;'>
                <img src='${$(this).find('img').eq(0).attr('src')}' style='aspect-ratio: 1/1; max-width: 100%; height: auto;'></img>
            </div><br>
            ${get_product_info_markup('Request Code', parent_card.attr('data-requestcode'))}
            ${get_product_info_markup('Order Code', parent_card.attr('data-ordercode'))}
            ${get_product_info_markup('Vendor Code', parent_card.attr('data-vendormapocode'))}
            ${is_whitespace(parent_card.attr('data-barcode')) ? '' : get_product_info_markup('Barcode', parent_card.attr('data-barcode'))}
            ${is_whitespace(parent_card.attr('data-brand')) ? '' : get_product_info_markup('Brand', parent_card.attr('data-brand'))}
            ${is_whitespace(parent_card.find('.product-remark-container').text()) ? '' : get_product_info_markup('Remark', parent_card.find('.product-remark-container').text())}
            ${get_product_info_markup('Order by', `${parent_card.attr('data-unitsize')} ${parent_card.attr('data-orderunitname')}`)}
            ${is_whitespace(parent_card.attr('data-productsize')) ? '' : get_product_info_markup('Product Size', parent_card.attr('data-productsize'))}
            ${get_product_info_markup('Category', parent_card.attr('data-categoryname'))}
            ${get_product_info_markup('Sub-Category', parent_card.attr('data-subcategoryname'))}
            ${get_product_info_markup('Provided from', parent_card.attr('data-vendorname'))}
            ${get_product_info_markup('Spent', `$${parseFloat(parent_card.attr('data-spent')).toFixed(2)}`)}
            ${get_product_info_markup('Ordered Quantity', parent_card.attr('data-stockordered'))}
            ${get_product_info_markup('Order Status', parent_card.attr('data-orderstatus'))}
            ${get_product_info_markup('Order On', parent_card.attr('data-createdonstr'))}
            ${get_product_info_markup('Payment Status', parent_card.attr('data-paymentstatus'))}
            ${get_product_info_markup('Latest Payment Update', latest_payment_update_date)}
            ${is_shiped ? get_product_info_markup('Shipped on', parent_card.attr('data-shipeddtstr')) : ''}
            ${is_delivered ? get_product_info_markup('Delivered on', parent_card.attr('data-delivereddtstr')) : ''}
        `);

        if (targeted_uom_order !== undefined){
            let most_recent_update_on = targeted_uom_order.createdon;
            if (is_shiped) most_recent_update_on = targeted_uom_order.shipped_dt;
            if (is_delivered) most_recent_update_on = targeted_uom_order.delivered_dt;
            // Determine is this order is at least 3 months recent
            const allow_issue = (TODAY_DATE - new Date(`${most_recent_update_on}`)) / (1000 * 60 * 60 * 24 * 30) <= 3;

            const allow_cancelation = targeted_uom_order.order_status_code === 1 && targeted_uom_order.payment_status_code === 0 && allow_issue;
            const allow_return = targeted_uom_order.order_status_code === 5 && targeted_uom_order.payment_status_code === 1 && allow_issue && is_delivered;

            CANCEL_ORDER_BTN.attr('data-activestatus', allow_cancelation ? '1' : '0');
            RETURN_ORDER_BTN.attr('data-activestatus', allow_return ? '1' : '0');
            ST_WRONG_ORDER_BTN.attr('data-activestatus', allow_issue ? '1' : '0');

            disable_button(CANCEL_ORDER_BTN, !allow_cancelation);
            disable_button(RETURN_ORDER_BTN, !allow_return);
            disable_button(ST_WRONG_ORDER_BTN, !allow_issue);
        }


        $('div[name=product-info-modal]').modal('show');
    });

    // Order issuing button functions
    function render_ticket_form_modal(modal_header, targeted_uom_order, order_status_code, payment_status_code){
        disable_button(ORDER_TICKET_FORM_MODAL.find('button'), false);
        const ticket_form = ORDER_TICKET_FORM_MODAL.find('.modal-body').eq(0).find('form').eq(0);
        ticket_form.attr('data-orderstatuscode', order_status_code);
        ticket_form.attr('data-paymentstatuscode', payment_status_code);
        ticket_form.attr('data-orderuid', targeted_uom_order.order_uid);

        ORDER_TICKET_TITLE_INPUT.val(modal_header);
        ORDER_TICKET_DESC_INPUT.val(null);
        ORDER_TICKET_FORM_MODAL.find('.modal-title').text(modal_header);

        ORDER_TICKET_FORM_MODAL.modal('show');
    }

    ORDER_TICKET_TITLE_INPUT.on('change, keyup', function(event){
        disable_button($('button[name=send-order-ticket-btn]'), !$(this).val() && is_whitespace($(this).val()));
    });

    $(document).on('click', `button[name=${CANCEL_ORDER_BTN.attr('name')}]`, function(event){
        if (targeted_uom_order === undefined || $('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        render_ticket_form_modal(`Order ${targeted_uom_order.order_code} cancelation`, targeted_uom_order, 6, 2);
    });

    $(document).on('click', `button[name=${RETURN_ORDER_BTN.attr('name')}]`, function(event){
        if (targeted_uom_order === undefined || $('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        render_ticket_form_modal(`Order ${targeted_uom_order.order_code} return`, targeted_uom_order, 3, targeted_uom_order.payment_status_code);
    });

    $(document).on('click', `button[name=${ST_WRONG_ORDER_BTN.attr('name')}]`, function(event){
        if (targeted_uom_order === undefined || $('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        render_ticket_form_modal(`Order ${targeted_uom_order.order_code} other issues`, targeted_uom_order, 8, targeted_uom_order.payment_status_code);
    });

    $(`div[name=${ORDER_TICKET_FORM_MODAL.attr('name')}], div[name=${UPLOAD_INVOICE_MODAL.attr('name')}]`).on('hide.bs.modal', function (e) {
        if ($('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1' || UPLOAD_FILE_BTN.attr('data-sendingrequest') === '1'){
            // Prevent auto closing Modal if POST Request has not completed
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        targeted_uom_order = undefined;
        return true;
    });

    //Submit Order Issue Ticket
    $('button[name=send-order-ticket-btn]').on('click', function(event){
        const this_btn = $(this);
        this_btn.attr('data-sendingrequest', 1);
        const parent_form = ORDER_TICKET_FORM_MODAL.find('.modal-body').eq(0).find('form').eq(0)

        ORDER_TICKET_TITLE_INPUT.attr('disabled', true);
        ORDER_TICKET_DESC_INPUT.prop('disabled', true);
        disable_button(this_btn, true, BSTR_BORDER_SPINNER);

        $.ajax({
            type: 'POST',
            url: 'https://prod-20.australiasoutheast.logic.azure.com:443/workflows/de01866ca0cb4fe881d003b608a0ee9d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mJqL8nSjYgU7RdrE55ZjvRVUwTYawj46ZrQiFOmrcHY',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            async: true,
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({'order_uid': parent_form.attr('data-orderuid'),
                                'user_uid': CUSTOMER_UID,
                                'order_status': parseInt(parent_form.attr('data-orderstatuscode')),
                                'payment_status': parseInt(parent_form.attr('data-paymentstatuscode')),
                                'ticket_title':  ORDER_TICKET_TITLE_INPUT.val(),
                                'ticket_remark': !ORDER_TICKET_DESC_INPUT.val() || is_whitespace(ORDER_TICKET_DESC_INPUT.val()) ? '' : ORDER_TICKET_DESC_INPUT.val()}),
            complete: function(response, status, xhr){
                this_btn.attr('data-sendingrequest', 0);
                disable_button(this_btn, false, 'Submit');
                ORDER_TICKET_TITLE_INPUT.attr('disabled', false);
                ORDER_TICKET_DESC_INPUT.prop('disabled', false);

                if (String(status) !== 'success') return alert('Failed to submit a ticket at this time');
                if ([504].includes(response.status)) return alert('Request timed out, please try again later');
                alert(`A ticket with ID ${response['responseJSON']['crcfc_uomprocurementserviceorderticketid']} has been successfully submited`);
                ORDER_TICKET_FORM_MODAL.modal('hide');
            }
        });
    });


    //Ordered product quantity function
    $(document).on('change keyup', 'input[name=product-quantity-input-field]', function(event){
        const valid_input = verify_integer_input($(this), $(this).attr('placeholder'), 0);
        if (!valid_input || [undefined, null].includes($(this).val())) return;

        const parent_tr = $(this).closest(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
        const stock_ordered = parseInt(parent_tr.attr('data-stockordered'));

        let _selected_order_status_value = 5;
        if (parseInt($(this).val()) === stock_ordered){
            _selected_order_status_value = 4;
        }else if (parseInt($(this).val()) > stock_ordered) {
            _selected_order_status_value = 7;
        }

        const correspond_order_status_obj = ORDER_STATUS_FILTER_OPTS.filter(data => data.value === _selected_order_status_value)[0];        
        process_order_status_opt_selection_btn(parent_tr, correspond_order_status_obj)
        parent_tr.attr('data-receivedquantity', $(this).val());
        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false);
    });

    // Order product order status change button
    $(document).on('change keyup', 'input[name=order-status-change-radio]', function(event){
        const _label = $(this).attr('data-label');
        const _value = parseInt($(this).attr('data-value'));

        const parent_tr = $(this).closest(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
        const correspond_order_status_obj = ORDER_STATUS_FILTER_OPTS.filter(data => data.value === _value)[0];        
        process_order_status_opt_selection_input_field_val(parent_tr, correspond_order_status_obj)

        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', '.update-order-status-btn', function(event){
        const uid_atrr_str = extract_all_data_uid_attributes($(this), true);
        if ($(this).attr('name') === 'select-uom-request-data-checkbox-on-request'){
            $(this).closest('table').find(`input[name=select-uom-request-data-checkbox-on-vendor]${uid_atrr_str},
                                            input[name=select-uom-request-data-checkbox-on-category]${uid_atrr_str},
                                            input[name=select-uom-request-data-checkbox-on-subcategory]${uid_atrr_str}`).prop('checked', $(this).prop('checked'));
        }else if ($(this).attr('name') === 'select-uom-request-data-checkbox-on-vendor') {
            $(this).closest('table').find(`input[name=select-uom-request-data-checkbox-on-category]${uid_atrr_str},
                                            input[name=select-uom-request-data-checkbox-on-subcategory]${uid_atrr_str}`).prop('checked', $(this).prop('checked'));
        }else if ($(this).attr('name') === 'select-uom-request-data-checkbox-on-category') {
            $(this).closest('table').find(`input[name=select-uom-request-data-checkbox-on-subcategory]${uid_atrr_str}`).prop('checked', $(this).prop('checked'));
        }
        disable_filter_elements($('.update-order-status-btn:checked').length < 1);
    });

    $(document).on('click', 'div[name=mass-order-status-selection-opt-btn]', function(event){
        disable_filter_elements();
        const _label = $(this).attr('data-label');
        const _value = parseInt($(this).attr('data-value'));
        const correspond_order_status_obj = ORDER_STATUS_FILTER_OPTS.filter(data => data.value === _value)[0];        

        $('.update-order-status-btn:checked').each(function(){
            const uid_atrr_str = extract_all_data_uid_attributes($(this), true);
            $(document).find(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]${uid_atrr_str}`).each(function(){
                process_order_status_opt_selection_input_field_val($(this), correspond_order_status_obj);
            });
        });
        disable_filter_elements(false);
        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false);
    });

    APPLY_ORDER_INFO_CHANGES_BTN.on('click', function(event){
        let progress = 0;
        const disabled_elements = $(`.form-check-input, .filter-opt-radio, div[name=mass-order-status-selection-opt-container], .product-quantity-input-field, .integer-input, .opt-selection-btn, .search-and-filter-section, div[name=product-info-btn], .image-container, span[name=${OPEN_INVOICE_UPLOAD_BTN.attr('name')}]`);
        disable_filter_elements(true, disabled_elements);
        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, true, BSTR_BORDER_SPINNER);

        let updated_order_list = [];
        $(document).find(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`).each(function(){
            const received_quantity_input_field = $(this).find('input[name=product-quantity-input-field]').eq(0);
            if (!received_quantity_input_field.val() ||[null, undefined].includes(received_quantity_input_field.val())) return;

            const corresponding_uom_order = FORMATTED_UOM_ORDERS.filter(order => order.order_uid === $(this).attr('data-orderuid') && order.request_uid === $(this).attr('data-requestuid'))[0];
            if (corresponding_uom_order === undefined) return;
            if (!corresponding_uom_order.is_beyond_approved) return;

            const og_received_quantity = corresponding_uom_order.received_quantity;
            const new_received_quantity = parseInt(received_quantity_input_field.val());
            if (new_received_quantity < 0 ) return;
            if ($(this).attr('data-ogorderstatuscode') === $(this).attr('data-orderstatuscode')
                && new_received_quantity === og_received_quantity) return;

            updated_order_list.push({
                'request_uid': corresponding_uom_order.request_uid,
                'order_uid': corresponding_uom_order.order_uid,
                'received_quantity': new_received_quantity,
                'ordered_quantity': corresponding_uom_order.stock_ordered,
                'order_status': $(this).attr('data-orderstatus'),
                'order_status_code': parseInt($(this).attr('data-orderstatuscode')),
                'payment_status': $(this).attr('data-paymentstatus'),
                'payment_status_code': parseInt($(this).attr('data-paymentstatuscode')),
                'product_vendor_map_uid': corresponding_uom_order.vendor_map_uid,
                'og_received_quantity': og_received_quantity,
                'og_ordered_quantity': corresponding_uom_order.stock_ordered,
            });
        });

        function _reset_body_state(){
            disable_filter_elements(false, disabled_elements);
            disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false, 'Apply Changes');
        }

        function _complete_request(){
            if (progress < updated_order_list.length - 1) return progress++;
            render_chart_js_content(false);
            alert('Update success');
            _reset_body_state();
        }
        let _grouped_updated_order_list = group_arr_of_objs(updated_order_list, 'request_uid');
        const grouped_uom_order_by_requests = group_arr_of_objs(FORMATTED_UOM_ORDERS, 'request_uid');
        _grouped_updated_order_list.forEach(grouped_updated_order => {
            const corresponding_grouped_uom_order_by_request = grouped_uom_order_by_requests.filter(data => data.key === grouped_updated_order.key)[0];
            if (corresponding_grouped_uom_order_by_request === undefined) return;
            
        });
        if (updated_order_list.length < 1) return _reset_body_state();

        function _ajax_update(updated_data){
            $.ajax({
                type: 'POST',
                url: 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/bb15c27a9ee54c678dc0f0b27240dbb1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tUtn4_vaj8Hm9Y3fkK5uhISsc8jZxElmZtA6bNT4L-g',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                async: true,
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify(updated_data),
                complete: function(response, status, xhr){
                    _complete_request();
                },
                success: function(response, status, xhr){
                    const corresponding_uom_order = FORMATTED_UOM_ORDERS.filter(order => order.order_uid === updated_data.order_uid && order.request_uid === updated_data.request_uid)[0];
                    const corresponding_uom_order_row = $(document).find(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row][data-orderuid='${updated_data.order_uid}'][data-requestuid='${updated_data.request_uid}']`);
                    if (corresponding_uom_order === undefined || corresponding_uom_order_row.length < 1) return;

                    corresponding_uom_order.received_quantity = updated_data.received_quantity;
                    corresponding_uom_order.order_status_code = updated_data.order_status_code;
                    corresponding_uom_order.order_status = updated_data.order_status;

                    corresponding_uom_order_row.find('input[name=product-quantity-input-field]').attr('placeholder', updated_data.received_quantity);
                    corresponding_uom_order_row.attr('data-ogorderstatuscode', updated_data.order_status_code);
                }, error: function(response, status, xhr){}
            });   
        }

        updated_order_list.forEach(function(updated_data, i){
            (function(y) {
                setTimeout(function() {
                    _ajax_update(updated_data);
                    }, y * 5);
                }(i));
        });
    });

    // Table row expand/collapse functions
    $(document).on('click', 'span[name=collapse-table-row-group-btn]', async function(event){
        const parent_attrs = extract_all_parent_target_data_attributes($(this));
        const parent_tr = $(this).closest('tr');
        const collapse_idx = parseInt($(this).attr('data-collapseidx'));
        const last_collpase_idx = parseInt($(this).attr('data-lastcollapseidx'));
        const main_collapse_data_value = $(this).attr('data-maincollapsedatavalue');
        const main_collapse_data_name = $(this).attr('data-maincollapsedataname');
        const parent_table = parent_tr.closest('table');
        const parent_table_name = parent_table.attr('name');

        const target_data_val = $(this).attr('data-targetdatavalue');
        const target_data_name = $(this).attr('data-targetdata');
        let alway_shown_tr_list = [parent_tr];      // css display attribute will always be set to table-row at the end regardless

        const expand = $(this).attr('data-expand') === '1';
        const default_row_span = parseInt($(this).attr('data-rowspan'));
        const curr_row_span = parseInt($(this).closest('th').attr('rowspan'));

        const row_span = expand ? curr_row_span : curr_row_span === default_row_span ? default_row_span : default_row_span - curr_row_span + 1;

        $(this).attr('data-expand', expand ? 0 : 1);
        expand ? $(this).addClass('rotate-upside-down') : $(this).removeClass('rotate-upside-down');
        // Setups
        $(parent_table).find(`tr[name=${parent_table_name}-row][${main_collapse_data_name}='${main_collapse_data_value}'][${target_data_name}='${target_data_val}']`).each(function(){
            // Iterate through each lower level from the next lower/child level
            const this_row = $(this);
            for (let i = collapse_idx + 1; i <= last_collpase_idx; i++){
                this_row.find(`span[name=collapse-table-row-group-btn][data-collapseidx='${i}']${parent_attrs.filter(parent_attr => parent_attr.idx <= collapse_idx).map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).each(function(){
                    // Automatically collapse lower leveled table rows on its higher level sibling interaction
                    $(this).closest('tr').find(`th[scope='row'][data-collapseidx='${i}']`).attr('rowspan', 1);
                    //$(this).closest('tr').find(`th[scope='row']`).css('background-color', 'grey');
                    if (!$(this).hasClass('rotate-upside-down')) $(this).addClass('rotate-upside-down');
                    $(this).attr('data-expand', 0);
                });
            }
        });

        // Accessing this level table rows
        $(`tr[name=${parent_table_name}-row][${main_collapse_data_name}='${main_collapse_data_value}'][${target_data_name}='${target_data_val}']${parent_attrs.filter(parent_attr => parent_attr.idx < collapse_idx).map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).each(function(){
            const this_row = $(this);
            // Access table rows that do not have any collapse button assigned
            if (this_row.find(`span[name=collapse-table-row-group-btn][data-collapseidx='${collapse_idx}'], 
                                span[name=collapse-table-row-group-btn][data-collapseidx='${collapse_idx + 1}']`).length < 1){
                // If this is not the last level always hide these rows
                if (collapse_idx < last_collpase_idx) return this_row.css('display', 'none');
                // Otherwise show/hide them based on the current expnsion status
                return this_row.css('display', expand ? 'none' : 'table-row');
            }

            if (this_row.find(`span[name=collapse-table-row-group-btn][data-collapseidx='${collapse_idx}']${parent_attrs.map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).length > 0) {
                return this_row.css('display', 'table-row');
            }
            if (this_row.find(`span[name=collapse-table-row-group-btn][data-collapseidx='${collapse_idx + 1}']${parent_attrs.filter(parent_attr => parent_attr.idx < collapse_idx).map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).length > 0) {
                return this_row.css('display', expand ? 'none' : 'table-row');
            }
        });

        // Accessing the higher level table rows
        $(parent_table).find(`tr[name=${parent_table_name}-row][${main_collapse_data_name}='${main_collapse_data_value}']`).each(function(){
            if ($(this).find('span[name=collapse-table-row-group-btn]').length < 1) return;
            if (parseInt($(this).find('span[name=collapse-table-row-group-btn]').attr('data-collapseidx')) >= collapse_idx) return;
            // Iterate to to previous level
            const this_row = $(this);

            for (let i = collapse_idx - 1; i >= 0; i--){
                // Visit the ith corresponding collapse button of each main table row
                this_row.find(`span[name=collapse-table-row-group-btn][data-collapseidx='${i}']${parent_attrs.filter(parent_attr => parent_attr.idx < i).map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).each(function(){
                    let have_common_parent_attr = true;
                    if (i > 0){
                        const parent_attr = parent_attrs.filter(parent_attr => parent_attr.idx === i)[0];
                        if (parent_attr !== undefined){
                            have_common_parent_attr = parent_attr.value === $(this).attr(parent_attr.name);
                        }
                    }
                    if (!have_common_parent_attr) return;
                    const curr_target_data_name = $(this).attr('data-targetdata');
                    const curr_target_data_val = $(this).attr('data-targetdatavalue');
                    //$(this).css('background-color', 'wheat');
                    if (parent_tr.attr(curr_target_data_name) === curr_target_data_val || i === 0){
                        
                        this_row.find(`th[scope='row'][data-collapseidx='${i}']`).each(function(){
                            if (curr_row_span === default_row_span && !expand) return;  // having to expand with the row span difference stays the same then do nothing
                            const this_row_span = parseInt($(this).attr('rowspan'));
                            $(this).attr('rowspan', !expand ? this_row_span + row_span - 1 : this_row_span - row_span + 1);
                        });
                    }
                });
            }
        });

        alway_shown_tr_list.forEach(tr => {
            tr.css('display', 'table-row');
        });
        
        parent_tr.find(`th[scope='row'][data-collapseidx='${collapse_idx}']`).each(function(){
            $(this).attr('rowspan', expand ? 1 : default_row_span);
        });
    });
});