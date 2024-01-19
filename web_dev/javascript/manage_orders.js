const AJAX_TIMEOUT_DURATION = 864000000;
const MAX_FILE_SIZE = 131072000; // in KB
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const DATE_RANGE_PICKER_CLASS = $('.date-range-picker-input');
const ORDER_DATE_FILTER_DROPDOWN = $('input[name="order-date-range"]');

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');
const VENDOR_SEARCH_TEXT_FIELD = $('input[name=vendor-search-input-field]');
const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');
const APPLY_ORDER_INFO_CHANGES_BTN = $('button[name=apply-order-info-changes-btn]');
const LOAD_MORE_ORDERS_BTN = $('button[name=load-more-orders-btn]');
const UPLOAD_FILE_BTN = $('button[name=upload-product-img]');
const DOWNLOAD_FILE_BTN = $('button[name=down-load-file]');
const OPEN_INVOICE_UPLOAD_BTN = $('span[name=attach-invoice-file-btn]');
const UPLOAD_INVOICE_FIELD = $('input[name=upload-img-input]');
let FILE_DOWNLOAD_LINK = undefined;

const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PROGRESS_BAR_DOM = $('div[name=request-loader-progress-bar]');
const ORDER_HISTORY_TABLE = $('table[name=order-history-table]');

const VENDOR_FILTER_DROPDOWN = $('ul[name=vendor-filter-opts]');
const CATEGORY_FILTER_DROPDOWN = $('ul[name=category-filter-opts]');
const SUBCATEGORY_FILTER_DROPDOWN = $('ul[name=sub-category-filter-opts]');
const BRAND_FILTER_DROPDOWN = $('ul[name=brand-filter-opts]');
const CUSTOMER_FILTER_DROPDOWN = $('ul[name=customer-filter-opts]');
const ORDER_STATUS_FILTER_DROPDOWN = $('ul[name=order-status-filter-opts]');
const PAYMENT_STATUS_FILTER_DROPDOWN = $('ul[name=payment-status-filter-opts]');

let product_filter_checkbox_func_names = '';
const FILTER_DROPDOWNS = [VENDOR_FILTER_DROPDOWN, CATEGORY_FILTER_DROPDOWN, SUBCATEGORY_FILTER_DROPDOWN, BRAND_FILTER_DROPDOWN, CUSTOMER_FILTER_DROPDOWN, ORDER_STATUS_FILTER_DROPDOWN, PAYMENT_STATUS_FILTER_DROPDOWN];
FILTER_DROPDOWNS.forEach((dropdown, idx) => {
    product_filter_checkbox_func_names += `input[name=${dropdown.attr('name')}-checkbox]${idx < FILTER_DROPDOWNS.length - 1 ? ', ' : ''}`;
});

let vendor_filter_options = [];
let brand_filter_options = [{'value': -1, 'label': 'No Brand'}];
let category_filter_options = [];
let subcategory_filter_options = [];
let customer_filter_options = [];

let VENDORS = [];
let UOM_PRODUCT_UIDS = [];
let FORMATTED_UOM_ORDERS = [];
const DISABLED_ELEM_CLASS = 'disabled-element';
const ERR_INPUT_INDICATOR_CLASS = 'red-outline';

const MAX_RECORD_NUM = 100;
let CURR_PAGE_NUM = 1;

const ORDER_STATUS_FILTER_OPTS = [
    {'value': 1, 'label': 'Ordered', 'colour': '#0067B9', 'selectable': true, 'text_color': 'white'},
    {'value': 2, 'label': 'Approved', 'colour': '#84BD00', 'selectable': true, 'text_color': 'white'},
    {'value': 3, 'label': 'Rejected', 'colour': '#F57F25', 'selectable': true, 'text_color': 'white'},
    {'value': 4, 'label': 'Received In-Full', 'colour': '#B0008E', 'selectable': true, 'text_color': 'white'},
    {'value': 5, 'label': 'Partially Received', 'colour': '#FFCD00', 'selectable': true, 'text_color': '#3D3935'},
    {'value': 6, 'label': 'Cancelled', 'colour': '#E9E9E9', 'selectable': true, 'text_color': '#3D3935'},
    {'value': 7, 'label': 'Error', 'colour': 'red', 'selectable': true, 'text_color': 'white'},
    {'value': 8, 'label': 'Awaiting', 'colour': '#0C2340', 'selectable': true, 'text_color': 'white'},
    {'value': 9, 'label': 'Closed', 'colour': '#D7DF23', 'selectable': true, 'text_color': 'white'},
];

const PAYMENT_STATUS_FILTER_OPTS = [
    {'value': 0, 'label': 'Pending Payment', 'colour': '#0067B9'},
    {'value': 1, 'label': 'Payment Received', 'colour': '#84BD00'},
    {'value': 2, 'label': 'Order Refunded', 'colour': 'red'},
]

const UPLOAD_INVOICE_MODAL = $('div[name=product-img-modal]');
let targeted_uom_order = undefined;
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

function _get_text_padding(max_length, curr_txt, html_tag='span'){
    return '';
    let padding_length = max_length - curr_txt.length;
    if (padding_length < 1) padding_length = 1;
    return `<${html_tag} id='text-padding'>${'#'.repeat(max_length - curr_txt.length)}</${html_tag}>`;
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

function get_base64_contents(b64_str){
    // return a list where:
    // [0]: mimetype
    // [1]: the base64 content string
    const b64_content_sections = b64_str.split(',');
    return [b64_content_sections[0].match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/)[0], b64_content_sections[1]];
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

function disable_button(button_dom, disabled=true, replace_markup=null){
    button_dom.attr('disabled', disabled);
    button_dom.css('background', `${disabled ? '#E9E9E9' : '#FAF9F6'}`);
    if (replace_markup != null && typeof replace_markup == 'string'){
        button_dom.empty();
        button_dom.append(replace_markup);
    }
}

function disable_filter_elements(disabled=true, elem_markup=undefined){
    const target_elems = elem_markup ?? $('div[name=mass-order-status-selection-opt-container], div[name=mass-order-status-selection-opt-container]');
    disabled ? target_elems.addClass(DISABLED_ELEM_CLASS) : target_elems.removeClass(DISABLED_ELEM_CLASS);
}

function _format_vendor_stock_remained(stock_on_hand, stock_ordered){
    const stock_remained = stock_on_hand - stock_ordered;
    return stock_remained >= 0 ? `${stock_remained} remained` : `${Math.abs(stock_remained)} required`;
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

function render_order_history_data_row(target_table){
    FORMATTED_UOM_ORDERS = FORMATTED_UOM_ORDERS.sort((a, b) => a.subcategory_name.localeCompare(b.subcategory_name));
    FORMATTED_UOM_ORDERS = FORMATTED_UOM_ORDERS.sort((a, b) => a.category_name.localeCompare(b.category_name));
    FORMATTED_UOM_ORDERS = FORMATTED_UOM_ORDERS.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
    FORMATTED_UOM_ORDERS = FORMATTED_UOM_ORDERS.sort((a, b) => new Date(b.createdon) - new Date(a.createdon));

    group_arr_of_objs(FORMATTED_UOM_ORDERS, 'request_uid').forEach(order_grouped_by_request => {
        const orders_grouped_by_vendor = group_arr_of_objs(order_grouped_by_request.grouped_objects, 'vendor_uid');
        orders_grouped_by_vendor.forEach((order_grouped_by_vendor, order_idx) => {

            const orders_grouped_by_category = group_arr_of_objs(order_grouped_by_vendor.grouped_objects, 'category_uid');
            orders_grouped_by_category.forEach((order_grouped_by_category, sub1_order_idx) => {

                const orders_grouped_by_subcategory = group_arr_of_objs(order_grouped_by_category.grouped_objects, 'subcategory_uid');                
                orders_grouped_by_subcategory.forEach((order_grouped_by_subcategory, sub2_order_idx) => {
                    order_grouped_by_subcategory.grouped_objects.forEach((formatted_uom_order, sub3_order_idx) => {

                        const received_quantity_input_field = formatted_uom_order.is_beyond_approved ? `<input maxlength='${String(formatted_uom_order.stock_ordered).length + 1}' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${formatted_uom_order.received_quantity}' name="product-quantity-input-field" value='${formatted_uom_order.received_quantity}'/>` : formatted_uom_order.received_quantity;
                        const ordered_quantity_input_field = `<input maxlength='${String(formatted_uom_order.stock_ordered).length + 1}' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${formatted_uom_order.stock_ordered}' name="product-ordered-quantity-input-field" value='${formatted_uom_order.stock_ordered}'/>`;

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
                        target_table.find('tbody').eq(0).append(`
                            <tr class='data-row' name='${target_table.attr('name')}-row'
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
                                data-vendorprice='${formatted_uom_order.vendor_price}'
                                data-requestuid='${formatted_uom_order.request_uid}' data-requestcode='${formatted_uom_order.request_code}'
                                data-isfirstidx='${get_sum_num_arr([order_idx, sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? 1 : 0}'
                                style='display: ${get_sum_num_arr([sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? 'table-row' : 'none'};'
                                ${make_target_data_attr_markup(parent_target_datas)}>
                                ${get_sum_num_arr([order_idx, sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? `
                                <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>
                                    ${make_request_status_checkbox('select-uom-request-data-checkbox-on-request', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}])}
                                </th>
                                <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>
                                    ${formatted_uom_order.request_code}
                                    ${make_collapse_tr_btn(0, orders_grouped_by_vendor.length, 'data-requestuid', formatted_uom_order.request_uid, 'data-requestuid', order_grouped_by_request.grouped_objects[0]['request_uid'], 3, parent_target_datas, false, orders_grouped_by_vendor.length <= 1)}
                                </th>
                                <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>${formatted_uom_order.customer_name}</th>
                                <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>
                                    ${formatted_uom_order.createdon_str}
                                </th>
                                <th scope="row" rowspan="${orders_grouped_by_vendor.length}" class='span-grouped-row' data-collapseidx='0'>
                                    ${formatted_uom_order.week_of_year_str}
                                </th>
                                ` : ''}
                                ${get_sum_num_arr([sub1_order_idx, sub2_order_idx, sub3_order_idx]) === 0 ? `
                                <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1'>
                                    ${make_request_status_checkbox('select-uom-request-data-checkbox-on-vendor', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}, {data_name: 'data-vendoruid', data_val: order_grouped_by_vendor.grouped_objects[0]['vendor_uid']}])}
                                </th>
                                <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1'><span class="material-symbols-rounded" name='${OPEN_INVOICE_UPLOAD_BTN.attr('name')}'>attach_file</span></th>
                                <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='1'>
                                    ${formatted_uom_order.vendor_name}
                                    ${make_collapse_tr_btn(1, orders_grouped_by_category.length, 'data-vendoruid', order_grouped_by_vendor.grouped_objects[0]['vendor_uid'], 'data-requestuid', order_grouped_by_request.grouped_objects[0]['request_uid'], 3, parent_target_datas, true, orders_grouped_by_category.length <= 1)}
                                </th>
                                ` : ''}
                                ${get_sum_num_arr([sub2_order_idx, sub3_order_idx]) === 0 ? 
                                `<th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='2'>
                                    ${make_request_status_checkbox('select-uom-request-data-checkbox-on-category', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}, {data_name: 'data-vendoruid', data_val: order_grouped_by_vendor.grouped_objects[0]['vendor_uid']},  {data_name: 'data-categoryuid', data_val: order_grouped_by_category.grouped_objects[0]['category_uid']}])}
                                </th>
                                <th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='2'>
                                    ${formatted_uom_order.category_name}
                                    ${make_collapse_tr_btn(2, orders_grouped_by_subcategory.length, 'data-categoryuid', order_grouped_by_category.grouped_objects[0]['category_uid'], 'data-requestuid', order_grouped_by_request.grouped_objects[0]['request_uid'], 3, parent_target_datas, true, orders_grouped_by_subcategory.length <= 1)}
                                </th>`:''
                                }
                                ${get_sum_num_arr([sub3_order_idx]) === 0 ? 
                                    `<th scope="row" rowspan="${1}" class='span-grouped-row' data-collapseidx='3'>
                                        ${make_request_status_checkbox('select-uom-request-data-checkbox-on-subcategory', [{data_name: 'data-requestuid', data_val: order_grouped_by_request.grouped_objects[0]['request_uid']}, {data_name: 'data-vendoruid', data_val: order_grouped_by_vendor.grouped_objects[0]['vendor_uid']},  {data_name: 'data-categoryuid', data_val: order_grouped_by_category.grouped_objects[0]['category_uid']}, {data_name: 'data-subcategoryuid', data_val: order_grouped_by_subcategory.grouped_objects[0]['subcategory_uid']}])}
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
                                <td scope="row">${ordered_quantity_input_field}</td>
                                <td scope="row">${received_quantity_input_field}</td>
                                <td scope="row">${formatted_uom_order.unit_size} ${formatted_uom_order.order_unit_name}</td>
                                <td scope="row" style='font-weight: 500;' name='est-spent-txt-container'>$${formatted_uom_order.est_price.toFixed(2)}</td>
                                <td scope="row">${order_status_selection_dropdown}</td>
                                <td scope="row">${formatted_uom_order.payment_status}</td>
                                <td scope="row">${formatted_uom_order.brand_name}</td>
                            </tr>`);
                    });
                });
            });
        });
    });
}


function format_request_order(uom_request, uom_order){
    return {
        'request_uid': uom_request.crcfc_uomprocurementorderrequestid,
        'request_code': uom_request.crcfc_requestcode,
        'customer_uid': uom_request['_crcfc_cutomer_value'],
        'customer_name': uom_request['_crcfc_cutomer_value@OData.Community.Display.V1.FormattedValue'],
        'order_uid': uom_order.prg_uomprocurementorderid,
        'order_code': `${uom_request.crcfc_requestcode}-${uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue']}`,
        'order_code_trimmed': clean_white_space(`${uom_request.crcfc_requestcode}-${uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue']}`.trim().toLowerCase()),
        'stock_ordered': uom_order.prg_stockordered,
        'received_quantity': uom_order.crcfc_received_quantity,
        'payment_status_code': uom_order.crcfc_paymentstatus,
        'payment_status': uom_order['crcfc_paymentstatus@OData.Community.Display.V1.FormattedValue'],
        'order_status_code': uom_order['prg_orderstatus'],
        'order_status': uom_order['prg_orderstatus@OData.Community.Display.V1.FormattedValue'],
        'is_beyond_approved': true,
        'allow_ticket_raised': false,
        'paid_on_dt': uom_order.crcfc_paidon,
        'paid_on_str': is_json_data_empty(uom_order.crcfc_paidon) ? '_' : format_dt(new Date(uom_order.crcfc_paidon)),
        'refund_on_dt': uom_order.crcfc_refundedon,
        'refund_on_str': is_json_data_empty(uom_order.crcfc_refundedon) ? '_' : format_dt(new Date(uom_order.crcfc_refundedon)),
        'shipped_dt': uom_order.crcfc_shippeddate,
        'shipped_str': is_json_data_empty(uom_order.crcfc_shippeddate) ? '_' : format_dt(new Date(uom_order.crcfc_shippeddate)),
        'delivered_dt': uom_order.crcfc_delivereddate,
        'delivered_str': is_json_data_empty(uom_order.crcfc_delivereddate) ? '_' : format_dt(new Date(uom_order.crcfc_delivereddate)),

        'product_uid': uom_order['_prg_product_value'],
        'product_barcode': is_json_data_empty(uom_order['product.prg_unitbarcodes']) ? '' : uom_order['product.prg_unitbarcodes'],
        'product_name': uom_order['_prg_product_value@OData.Community.Display.V1.FormattedValue'],
        'product_trimmed_name': clean_white_space(uom_order['_prg_product_value@OData.Community.Display.V1.FormattedValue'].trim().toLowerCase()),
        'thumbnail_img': covert_product_b64_img_to_url(uom_order['product.crcfc_img_content_mime_type'], uom_order['product.crcfc_img_content']),
        'remark': uom_order['product.prg_remarks'] ?? '',
        'min_quantity': uom_order['product.prg_minorderquantity'],
        'order_unit_code': uom_order['product.prg_orderunit'],
        'order_unit_name': uom_order['product.prg_orderunit@OData.Community.Display.V1.FormattedValue'],
        'product_size': is_json_data_empty(uom_order['product.prg_productsize']) ? '' : uom_order['product.prg_productsize'],
        'unit_size': uom_order['product.prg_unitsize'],
        'category_uid': uom_order['product.prg_category'],
        'category_name': uom_order['product.prg_category@OData.Community.Display.V1.FormattedValue'],
        'subcategory_uid': uom_order['product.prg_subcategory'],
        'subcategory_name': uom_order['product.prg_subcategory@OData.Community.Display.V1.FormattedValue'],
        'brand_code': is_json_data_empty(uom_order['product.prg_brand']) ? -1 : uom_order['product.prg_brand'],
        'brand_name': is_json_data_empty(uom_order['product.prg_brand@OData.Community.Display.V1.FormattedValue']) ? 'No Brand' : uom_order['product.prg_brand@OData.Community.Display.V1.FormattedValue'],
        'vendor_uid': uom_order['_prg_vendor_value'],
        'vendor_name': uom_order['_prg_vendor_value@OData.Community.Display.V1.FormattedValue'],
        'vendor_map_code': uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue'],
        'vendor_map_uid': uom_order['_prg_vendorcode_value'],
        'vendor_stock_on_hand': uom_order['product_vendor_map.prg_stockonhand'],
        'vendor_stock_ordered': uom_order['product_vendor_map.prg_sumstockordered'],
        'vendor_stock_remained': uom_order['product_vendor_map.prg_stockonhand'] - uom_order['product_vendor_map.prg_sumstockordered'],
        'vendor_stock_remained_str': _format_vendor_stock_remained(uom_order['product_vendor_map.prg_stockonhand'], uom_order['product_vendor_map.prg_sumstockordered']),
        'vendor_stock_transit': uom_order['product_vendor_map.prg_stockintransit'],
        'vendor_price':  uom_order.prg_stockordered < 1 ? 0 :uom_order['crcfc_est_price'] / uom_order.prg_stockordered,//uom_order['product_vendor_map.prg_price_base'],
        'est_price': uom_order['crcfc_est_price'],
        'createdon_str': format_dt(new Date(uom_request.createdon)),
        'createdon': uom_request.createdon,
        'week_of_year_str': date_to_week_str(uom_request.createdon),

        'bulk_order_unit_code': is_json_data_empty(uom_order['product.prg_bulkorder']) ? 0 : uom_order['product.prg_bulkorder'],
        'bulk_order_unit_name': is_json_data_empty(uom_order['product.prg_bulkorder']) ? 'N/A' : uom_order['product.prg_bulkorder@OData.Community.Display.V1.FormattedValue'],
        'is_active': uom_request.statecode === 0,
    }
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
    //$('.progress-indicator').find('h6').text(`${curr_progress.toFixed(2)}%`);
}
/*End of Util functions*/


function render_filter_options(dropdown_container, filter_opts, sort_by_label=false){
    if (sort_by_label) filter_opts = filter_opts.sort((a, b) => a.label.localeCompare(b.label));
    filter_opts.forEach(filter_opt => {
        dropdown_container.append(`
        <div class='dropdown-item  order-attr-filter-opt-container'>
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
    date_input.daterangepicker({ 
        opens: 'left',
        startDate: min_date, // after open picker you'll see this dates as picked
        endDate: max_date,
        locale: {
           format: 'DD-MM-YYYY',
        }
    },
    function(start, end, label) {
        const start_date = start.format('DD/MM/YYYY');
        const end_date = end.format('DD/MM/YYYY');

        date_input.attr('data-start', start_date === undefined ? min_date : start_date);
        date_input.attr('data-end', end_date === undefined ? max_date : end_date);
        //start_date === undefined || end_date === undefined ? date_input.val('---') : date_input.val(`${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`);
    }
    ).val(`${date_input.attr('data-start')} - ${date_input.attr('data-end')}`);
    //date_input.val(`${date_input.attr('data-start')} - ${date_input.attr('data-end')}`);
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
            disable_filter_elements(true, $('div[name=mass-order-status-selection-opt-container]'));
        }, success: function(response, status, xhr){
            const {min, max} = get_min_max_from_dt_arr([response.oldest_uom_request[0]['createdon'], response.newest_uom_request[0]['createdon']]);
            set_up_date_range_picker(ORDER_DATE_FILTER_DROPDOWN, min, max);

            ORDER_STATUS_FILTER_OPTS.filter(data => data.selectable).forEach(data => {
                $('div[name=mass-order-status-selection-opt-container]').append(`
                    <div class='filter-container opt-selection-btn' id='sort-container' style='background-color: ${data.colour}; color: ${data.text_color}'
                        name='mass-order-status-selection-opt-btn' data-value='${data.value}' data-label='${data.label}'>
                        <a class='nav-link' data-bs-toggle='dropdown' aria-expanded='false'>${data.label}</a>
                    </div>
                `);
            });

            response.vendors.forEach(vendor => {
                vendor_filter_options.push({
                    'value': vendor.prg_uomprocurementvendorid,
                    'label': vendor.prg_name,
                });
                VENDORS.push({
                    'vendor_uid': vendor.prg_uomprocurementvendorid,
                    'vendor_name': vendor.prg_name,
                    'vendor_name_trimmed': clean_white_space(vendor.prg_name.trim().toLowerCase()),
                });
            });
            response.brands.forEach(brand => {
                brand_filter_options.push({'label': brand.prg_name, 'value': brand.prg_ggorderbrandid});
            });

            response.sub_categories.forEach(sub_category => {
                subcategory_filter_options.push({'label': sub_category.prg_name, 'value': sub_category.prg_uomprocurementservicesubcatgeoryid});
            });

            response.categories.forEach(category => {
                category_filter_options.push({'label': category.prg_name, 'value': category.prg_uomprocurementservicecategoriesid});
            });

            response.customers.forEach(customer => {
                customer_filter_options.push({'label': customer.yomifullname, 'value': customer.contactid});
            });

            render_filter_options(VENDOR_FILTER_DROPDOWN, vendor_filter_options);
            render_filter_options(BRAND_FILTER_DROPDOWN, brand_filter_options);
            render_filter_options(CATEGORY_FILTER_DROPDOWN, category_filter_options);
            render_filter_options(SUBCATEGORY_FILTER_DROPDOWN, subcategory_filter_options);
            render_filter_options(CUSTOMER_FILTER_DROPDOWN, customer_filter_options);
            render_filter_options(ORDER_STATUS_FILTER_DROPDOWN, ORDER_STATUS_FILTER_OPTS);
            render_filter_options(PAYMENT_STATUS_FILTER_DROPDOWN, PAYMENT_STATUS_FILTER_OPTS);

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
    }else if ([5].includes(correspond_order_status_obj.value)) {
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
    }else if ([1, 3, 6, 7].includes(correspond_order_status_obj.value)) {
        parent_tr.attr('data-receivedquantity', 0);
        parent_tr.find('input[name=product-quantity-input-field]').val(0);
    }

    process_order_status_opt_selection_btn(parent_tr, correspond_order_status_obj);
}


$(document).ready(function(){
    hide_elems_on_load();
    render_body_content();

    DATE_RANGE_PICKER_CLASS.on('keyup change', function(event){
        $(this).val(`${$(this).attr('data-start')} - ${$(this).attr('data-end')}`);
    });
    $(document).on('click', '.applyBtn.btn.btn-sm.btn-primary', function(e){
        disable_button(APPLY_FILTER_BTN, false);
        disable_button(CLEAR_FILTER_BTN, false);
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
        if (!complete) ORDER_HISTORY_TABLE.find('tbody').empty();
        render_loading_progress_bar(0);
        $('.resource-loader-section').toggle(!complete);
        $('div[name=spinner-resource-loader-container]').toggle(false);
        $('div[name=progress-resource-loader-container]').toggle(!complete);
        disable_filter_elements(!complete);
        disable_filter_elements(!complete, $('input[name=select-uom-request-data-checkbox], .product-quantity-input-field, .single-order-status-selection-opt-btn'));
        $('.content-section.order-history-content-section').toggle(complete);
        disable_button(APPLY_ORDER_INFO_CHANGES_BTN);
    }

    function ready_loading_query(complete=false){
        ready_load_more_query(complete);
        if (!complete) {
            CURR_PAGE_NUM = 1;
            FORMATTED_UOM_ORDERS = [];
            ORDER_HISTORY_TABLE.find('tbody').empty();
        }
    }

    function get_xml_queries(){
        const searched_vendor = [undefined, null].includes(VENDOR_SEARCH_TEXT_FIELD.val()) ? '' : VENDOR_SEARCH_TEXT_FIELD.val();
        const filtered_vendor_opts = get_selected_filter_values(`${VENDOR_FILTER_DROPDOWN.attr('name')}-checkbox`);

        const searched_products = [undefined, null].includes(PRODUCT_SEARCH_TEXT_FIELD.val()) ? '' : PRODUCT_SEARCH_TEXT_FIELD.val();
        let filtered_brand_opts =  get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`);
        if (filtered_brand_opts.indexOf('-1') !== -1) {
            // Replace '-1' with null
            filtered_brand_opts = filtered_brand_opts.map(function(item) {
                return item === '-1' ? null : item;
            });
        }
        const filtered_category_opts =  get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_subcategory_opts =  get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        
        const filtered_vendors = VENDORS.filter(vendor => filtered_vendor_opts.includes(vendor.vendor_uid) && vendor.vendor_name_trimmed.includes(clean_white_space(searched_vendor.trim().toLowerCase())));
        const filtered_vendor_xml_query = `
        <condition attribute="prg_vendor" operator="in">
            ${filtered_vendors.map(vendor => `<value>${vendor.vendor_uid}</value>`).join('\n')}
        </condition>
        `;
        const filtered_customers = get_selected_filter_values(`${CUSTOMER_FILTER_DROPDOWN.attr('name')}-checkbox`);

        const filtered_customer_xml_query = `
        <condition attribute="crcfc_cutomer" operator="in">
            ${filtered_customers.map(data => `<value>${data}</value>`).join('\n')}
        </condition>
        `;

        const filtered_category_xml_query = `
        <condition attribute="prg_category" operator="in">
            ${filtered_category_opts.map(data => `<value>${data}</value>`).join('\n')}
        </condition>`;
        const filtered_subcategory_xml_query = `
        <condition attribute="prg_subcategory" operator="in">
            ${filtered_subcategory_opts.map(data => `<value>${data}</value>`).join('\n')}
        </condition>`;
        const filtered_product_name_xml_query = `<condition attribute="prg_name_trimmed" operator="like" value="%${clean_white_space(searched_products.trim().toLowerCase())}%" />`;

        const filtered_brand_xml_query = filtered_brand_opts.includes(null) ? `
        <filter type="or">
            <condition attribute="prg_brand" operator="in">
                ${filtered_brand_opts.filter(data => data !== null).map(data => `<value>${data}</value>`).join('\n')}
            </condition>
            <condition attribute="prg_brand" operator="null" />
        </filter>` :
        `<filter type="and">
            <condition attribute="prg_brand" operator="in">
                ${filtered_brand_opts.map(data => `<value>${data}</value>`).join('\n')}
            </condition>
        </filter>`;

        let start_createdon = format_dt_to_xml_query_dt(ORDER_DATE_FILTER_DROPDOWN.attr('data-start'));
        if (start_createdon === undefined) start_createdon = format_dt_to_xml_query_dt(parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('min')), true));
        let end_createdon = format_dt_to_xml_query_dt(ORDER_DATE_FILTER_DROPDOWN.attr('data-end'));
        if (end_createdon === undefined) end_createdon = format_dt_to_xml_query_dt(parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('max')), true));

        const filtered_order_status_opts =  get_selected_filter_values(`${ORDER_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_payment_status_opts =  get_selected_filter_values(`${PAYMENT_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_order_status_xml_query = `
        <condition attribute="prg_orderstatus" operator="in">
            ${filtered_order_status_opts.map(data => `<value>${data}</value>`).join('\n')}
        </condition>
        `;
        const filtered_payment_status_xml_query = `
        <condition attribute="crcfc_paymentstatus" operator="in">
            ${filtered_payment_status_opts.map(data => `<value>${data}</value>`).join('\n')}
        </condition>
        `;

        return {
            'filtered_customer_xml_query': filtered_customer_xml_query,
            'createdon_xml_filter_query': `<condition attribute="createdon" operator="on-or-after" value="${start_createdon}" />
                                            <condition attribute="createdon" operator="on-or-before" value="${end_createdon}" />`,
            'filtered_product_name_xml_query': filtered_product_name_xml_query,
            'filtered_brand_xml_query': filtered_brand_xml_query,
            'filtered_subcategory_xml_query': filtered_subcategory_xml_query,
            'filtered_category_xml_query': filtered_category_xml_query,
            'filtered_vendor_xml_query': filtered_vendor_xml_query,
            'filtered_order_status_xml_query': filtered_order_status_xml_query,
            'filtered_payment_status_xml_query': filtered_payment_status_xml_query,
        }
    }

    $('.init-resource-query-btn').on('click', function(event){
        let progress = 0;
        const this_btn = $(this);
        const is_loadmore = this_btn.attr('name') === LOAD_MORE_ORDERS_BTN.attr('name');

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button($('.init-resource-query-btn'), true);
        is_loadmore ? disable_button(this_btn, true) : disable_button(this_btn, true, BSTR_BORDER_SPINNER);

        const searched_vendor = [undefined, null].includes(VENDOR_SEARCH_TEXT_FIELD.val()) ? '' : VENDOR_SEARCH_TEXT_FIELD.val();
        const filtered_vendor_opts = get_selected_filter_values(`${VENDOR_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_vendors = VENDORS.filter(vendor => filtered_vendor_opts.includes(vendor.vendor_uid) && vendor.vendor_name_trimmed.includes(clean_white_space(searched_vendor.trim().toLowerCase())));

        const {filtered_customer_xml_query, 
                createdon_xml_filter_query, 
                filtered_product_name_xml_query,
                filtered_brand_xml_query,
                filtered_subcategory_xml_query, filtered_category_xml_query,
                filtered_vendor_xml_query,
                filtered_order_status_xml_query, filtered_payment_status_xml_query
            } = get_xml_queries();

        is_loadmore ? ready_load_more_query() : ready_loading_query();

        function _complete_request(num_queries){
            if (progress < num_queries - 1) return progress++;
            render_order_history_data_row(ORDER_HISTORY_TABLE);
            ready_loading_query(true);
            disable_button(CLEAR_FILTER_BTN, false);
            disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');
            disable_filter_elements(true, $('.order-attr-filter-opt-container'));

            disable_filter_elements($(document).find('input[name=select-uom-request-data-checkbox]:checked').length < 1, $('div[name=mass-order-status-selection-opt-container]'));
        }

        function retrieve_uom_order_info(uom_request, uom_requests){
            $.ajax({
                type: 'POST',
                url: 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/2bd9c557ccf546299a83738a56a82f8e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=AMAacIhol-5zcKaX7qExZg6I4fPzLlt4Tbs33-EHs58',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                async: true,
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({
                    'uom_request_uid': uom_request.crcfc_uomprocurementorderrequestid,
                    'filtered_product_name_xml_query': filtered_product_name_xml_query,
                    'filtered_brand_xml_query': filtered_brand_xml_query,
                    'filtered_subcategory_xml_query': filtered_subcategory_xml_query,
                    'filtered_category_xml_query': filtered_category_xml_query,
                    'filtered_vendor_xml_query': filtered_vendor_xml_query,
                    'filtered_order_status_xml_query': filtered_order_status_xml_query,
                    'filtered_payment_status_xml_query': filtered_payment_status_xml_query,
                }),
                complete: function(response, status, xhr){
                    _complete_request(uom_requests.length);
                    render_loading_progress_bar(100 * progress / uom_requests.length);
                },
                success: function(response, status, xhr){
                    let uom_request_copied = [];
                    response.uom_orders.forEach(uom_order => {
                        const formatted_uom_order = format_request_order(uom_request, uom_order);
                        uom_request_copied.push(formatted_uom_order);
                        FORMATTED_UOM_ORDERS.push(formatted_uom_order);
                    });
                },
                error: function(response, status, xhr){
                },
            });
        }

        disable_filter_elements(true, $('.order-attr-filter-opt-container'));
        $.ajax({
            type: 'POST',
            url: 'https://prod-24.australiasoutheast.logic.azure.com:443/workflows/ae54872535734002bef508f760f25347/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WfTgvyJJCDwVnVGs4N4lqZU94v4EYSvK-OjU8HuJ6Oc',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            async: true,
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({
                'filtered_customer_xml_query': filtered_customer_xml_query,
                'createdon_xml_filter_query': createdon_xml_filter_query,
                'page_num': CURR_PAGE_NUM,
                'num_records': MAX_RECORD_NUM
            }),
            complete: function(response, status, xhr){
            },
            success: function(response, status, xhr){
                disable_button(LOAD_MORE_ORDERS_BTN, !response.has_next_records);
                response.has_next_records ? LOAD_MORE_ORDERS_BTN.show() : LOAD_MORE_ORDERS_BTN.hide();
                if (response.has_next_records) CURR_PAGE_NUM++;
                if (response.uom_requests.length < 1){
                    _complete_request(0);
                    render_loading_progress_bar(100);
                    return alert('No data to load');
                }
                render_loading_progress_bar(0);
                response.uom_requests.forEach((uom_request, i) => {
                    (function(y) {
                        setTimeout(function() {
                            retrieve_uom_order_info(uom_request, response.uom_requests);
                            }, y * 10);
                        }(i));
                });
            },
            error: function(response, status, xhr){
            },
        });
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        $('div[name=search-filter-container]').find('.search-text-field.filter-search-text-field').val(null);
        $(document).find('.form-check-input').prop('checked', false);
        $(document).find('.form-check-input').attr('checked', false);

        ready_loading_query();
        $('div[name=progress-resource-loader-container]').toggle(false);
        ORDER_DATE_FILTER_DROPDOWN.val(`${parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('min')), true)} - ${parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('max')), true)}`);
        disable_filter_elements(false);
        disable_filter_elements(false, $('.order-attr-filter-opt-container'));
        disable_filter_elements(true, $('div[name=mass-order-status-selection-opt-container]'));

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, false);
    });

    // Modal functions
    $(document).on('click', '.close-modal-btn', function(event){
        if ($('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1' || UPLOAD_FILE_BTN.attr('data-sendingrequest') === '1') return;
        $(this).closest('.modal').modal('hide');
    });

    $(`div[name=${UPLOAD_INVOICE_MODAL.attr('name')}]`).on('hide.bs.modal', function (e) {
        if ($('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1' || UPLOAD_FILE_BTN.attr('data-sendingrequest') === '1'){
            // Prevent auto closing Modal if POST Request has not completed
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        targeted_uom_order = undefined;
        return true;
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
        const payment_status_code = parseInt(parent_card.attr('data-paymentstatuscode'));

        let latest_payment_update_date = parent_card.attr('data-payondatestr');
        if (payment_status_code === 2) latest_payment_update_date = parent_card.attr('data-refunddatestr');

        const is_shiped = targeted_uom_order.shipped_dt !== undefined && targeted_uom_order.shipped_dt instanceof Date;
        const is_delivered = targeted_uom_order.delivered_dt !== undefined && targeted_uom_order.delivered_dt instanceof Date;
        $('div[name=product-info-modal]').find('.modal-title').text(parent_card.attr('data-productname'));
        $('div[name=product-info-modal]').find('.modal-body').empty();
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
        $('div[name=product-info-modal]').modal('show');
    });


    $(document).on('click', 'span[name=collapse-vendor-group-btn]', function(event){
        const expand = $(this).attr('data-expand') === '1';
        const row_span = expand ? '1' : $(this).attr('data-rowspan');
        $(this).attr('data-expand', expand ? 0 : 1);
        const target_uid = $(this).attr('data-requestuid');
        const target_data_name = $(this).attr('data-targetdata');
        const parent_table = $(this).closest('table');
        const parent_table_name = parent_table.attr('name');
        //$(this).css('transform', 'rotate(180deg)');
        expand ? $(this).addClass('rotate-upside-down') : $(this).removeClass('rotate-upside-down');
        
        $(document).find(`tr[name=${parent_table_name}-row][${target_data_name}='${target_uid}'][data-isfirstidx='1']`).find('th').attr('rowspan', row_span);
        expand ? $(document).find(`tr[name=${parent_table_name}-row][${target_data_name}='${target_uid}'][data-isfirstidx='0']`).hide() : $(document).find(`tr[name=${parent_table_name}-row][${target_data_name}='${target_uid}'][data-isfirstidx='0']`).show();
    });


    // Product Vendor Map Attribute Edit text field event function
    function verify_valid_info_fields(parent_table_name){
        let is_valid = true;
        function _invalidate_input(input_field){
            is_valid = false;
            input_field.addClass(ERR_INPUT_INDICATOR_CLASS);
        }

        // Check for null value
        $('.long-txt-edit-field, .product-quantity-input-field').each(function(){
            if (!$(this).val() || is_whitespace($(this).val())) _invalidate_input($(this));
        });

        group_arr_of_objs(FORMATTED_UOM_ORDERS, 'vendor_uid').forEach(vendor_grouped_data => {
            let non_dupl_vendor_map_codes = [];
            $(`tr[name=${parent_table_name}-row][data-vendoruid='${vendor_grouped_data.key}']`).each(function(){
                $(this).find('input[name=vendor-map-code-input-field]').each(function(){
                    if (!$(this).val() || is_whitespace($(this).val())) return _invalidate_input($(this));
                    const map_code = `${clean_white_space($(this).val().trim().toLowerCase())}${clean_white_space($(this).closest('tr').attr('data-productname').trim().toLowerCase())}`;
                    if (!non_dupl_vendor_map_codes.includes(map_code)) {
                        non_dupl_vendor_map_codes.push(map_code);
                    }else{
                        _invalidate_input($(this));
                    }
                });
            });
        });

        // Verify numeric input values
        $('.product-quantity-input-field').each(function(){
            if (!$(this).val() || is_whitespace($(this).val())) return _invalidate_input($(this));
            let curr_value = $(this).val();
            const is_int = $(this).attr('name') === 'stock-on-hand-input-field';
            curr_value = is_int ? parseInt(curr_value.replace(/\D/g, '')) : parseFloat(curr_value.replace(/[^-?0-9.]/g, ''));
            if (isNaN(curr_value)) _invalidate_input($(this));
            const max = 1000000;
            const min =  is_int ? 0 : 0.00000001;
            if (curr_value <= min || curr_value > max) _invalidate_input($(this));
        });

        return is_valid;
    }

    // Order product order status change button
    function process_order_stock_received_input_changes(stock_received_input){
        const valid_input = verify_number_input(stock_received_input, true, 0, 100000);
        if (!valid_input || [undefined, null].includes(stock_received_input.val())) return;

        const parent_tr = stock_received_input.closest(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
        const stock_ordered = parseInt(parent_tr.attr('data-stockordered'));

        let _selected_order_status_value = 5;
        if (parseInt(stock_received_input.val()) === stock_ordered){
            _selected_order_status_value = 4;
        }else if (parseInt(stock_received_input.val()) > stock_ordered) {
            _selected_order_status_value = 7;
        }

        const correspond_order_status_obj = ORDER_STATUS_FILTER_OPTS.filter(data => data.value === _selected_order_status_value)[0];        
        process_order_status_opt_selection_btn(parent_tr, correspond_order_status_obj)
        parent_tr.attr('data-receivedquantity', stock_received_input.val());
        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false);
    }

    $(document).on('blur', '.product-quantity-input-field', function(event){
        if (!$(this).val() || [undefined, null].includes($(this).val())){
            $(this).val($(this).attr('placeholder'));
        }
    });

    $(document).on('change keyup', 'input[name=product-ordered-quantity-input-field]', function(event){
        const valid_input = verify_number_input($(this), true, 1, 100000);
        if (!valid_input || [undefined, null].includes($(this).val())) return;

        const parent_tr = $(this).closest(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
        const corresponding_uom_order = FORMATTED_UOM_ORDERS.filter(order => order.order_uid === parent_tr.attr('data-orderuid'))[0];
        if (corresponding_uom_order === undefined) return;

        const new_stock_ordered = !isNaN(parseInt($(this).val())) ? parseInt($(this).val()) : corresponding_uom_order.stock_ordered;
        const new_est_price = parseFloat(new_stock_ordered * corresponding_uom_order.vendor_price).toFixed(2);
        
        parent_tr.find(`td[name=est-spent-txt-container]`).text(`$${new_est_price}`);
        parent_tr.attr('data-stockordered', new_stock_ordered);

        const stock_received_input = parent_tr.find('input[name=product-quantity-input-field]');
        process_order_stock_received_input_changes(stock_received_input);
    });

    $(document).on('change keyup', 'input[name=product-quantity-input-field]', function(event){
        process_order_stock_received_input_changes($(this));
        const valid_input = verify_number_input($(this), true, 0, 100000);
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

    $(document).on('change keyup', 'input[name=order-status-change-radio]', function(event){
        const _label = $(this).attr('data-label');
        const _value = parseInt($(this).attr('data-value'));

        const parent_tr = $(this).closest(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
        const correspond_order_status_obj = ORDER_STATUS_FILTER_OPTS.filter(data => data.value === _value)[0];        
        process_order_status_opt_selection_input_field_val(parent_tr, correspond_order_status_obj)

        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', 'input[name=select-uom-request-data-checkbox]', function(event){
        disable_filter_elements($('input[name=select-uom-request-data-checkbox]:checked').length < 1);
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
        const disabled_elements = $(`.form-check-input, .filter-opt-radio, div[name=mass-order-status-selection-opt-container], .product-quantity-input-field, .integer-input, .opt-selection-btn, .search-and-filter-section, div[name=product-info-btn], .image-container, button[name=load-more-orders-btn], span[name=${OPEN_INVOICE_UPLOAD_BTN.attr('name')}]`);
        disable_filter_elements(true, disabled_elements);
        disable_button(APPLY_ORDER_INFO_CHANGES_BTN, true, BSTR_BORDER_SPINNER);

        let updated_order_list = [];
        $(document).find(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`).each(function(){
            const received_quantity_input_field = $(this).find('input[name=product-quantity-input-field]').eq(0);
            if (!received_quantity_input_field.val() ||[null, undefined].includes(received_quantity_input_field.val())) return;

            const ordered_quantity_input_field = $(this).find('input[name=product-ordered-quantity-input-field]').eq(0);
            if (!ordered_quantity_input_field.val() ||[null, undefined].includes(ordered_quantity_input_field.val())) return;

            const corresponding_uom_order = FORMATTED_UOM_ORDERS.filter(order => order.order_uid === $(this).attr('data-orderuid') && order.request_uid === $(this).attr('data-requestuid'))[0];
            if (corresponding_uom_order === undefined) return;
            if (!corresponding_uom_order.is_beyond_approved) return;

            const og_received_quantity = corresponding_uom_order.received_quantity;
            const new_received_quantity = parseInt(received_quantity_input_field.val());
            if (new_received_quantity < 0) return;

            const og_ordered_quantity = corresponding_uom_order.stock_ordered;
            const new_ordered_quantity = parseInt(ordered_quantity_input_field.val());
            if (new_ordered_quantity < 1) return;

            if ($(this).attr('data-ogorderstatuscode') === $(this).attr('data-orderstatuscode')
                && new_received_quantity === og_received_quantity
                && new_ordered_quantity === og_ordered_quantity) return;

            updated_order_list.push({
                'request_uid': corresponding_uom_order.request_uid,
                'order_uid': corresponding_uom_order.order_uid,
                'received_quantity': new_received_quantity,
                'ordered_quantity': new_ordered_quantity,
                'order_status': $(this).attr('data-orderstatus'),
                'order_status_code': parseInt($(this).attr('data-orderstatuscode')),
                'payment_status': $(this).attr('data-paymentstatus'),
                'payment_status_code': parseInt($(this).attr('data-paymentstatuscode')),
                'product_vendor_map_uid': corresponding_uom_order.vendor_map_uid,
                'og_received_quantity': og_received_quantity,
                'og_ordered_quantity': og_ordered_quantity,
            });
        });

        function _reset_body_state(){
            disable_filter_elements(false, disabled_elements);
            disable_button(APPLY_ORDER_INFO_CHANGES_BTN, false, 'Apply Changes');
        }

        function _complete_request(){
            if (progress < updated_order_list.length - 1) return progress++;
            $.ajax({
                type: 'POST',
                url: 'https://prod-25.australiasoutheast.logic.azure.com:443/workflows/6e9f0dbcb1154e2aa56d1218a922f430/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=NKA9MWl4URhMvH69yxZSA5-Sf4qySbT_4ZE_xR8IOcY',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                async: true,
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify(group_arr_of_objs(updated_order_list, 'request_uid')),
                complete: function(response, status, xhr){
                },
            });
            alert('Update success');
            _reset_body_state();
        }
        /*console.log(JSON.stringify(group_arr_of_objs(updated_order_list, 'request_uid')));
        console.log(updated_order_list.length);
        return;*/
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
                    corresponding_uom_order.stock_ordered = updated_data.ordered_quantity;
                    corresponding_uom_order.order_status_code = updated_data.order_status_code;
                    corresponding_uom_order.order_status = updated_data.order_status;

                    corresponding_uom_order_row.find('input[name=product-quantity-input-field]').attr('placeholder', updated_data.received_quantity);
                    corresponding_uom_order_row.find('input[name=product-ordered-quantity-input-field]').attr('placeholder', updated_data.ordered_quantity);
                    corresponding_uom_order_row.attr('data-ogorderstatuscode', updated_data.order_status_code);
                }, error: function(response, status, xhr){}
            });   
        }

        updated_order_list.forEach(function(updated_data, i){
            (function(y) {
                setTimeout(function() {
                    _ajax_update(updated_data);
                    }, y * 10);
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
                this_row.find(`span[name=collapse-table-row-group-btn][data-collapseidx='${i}']${parent_attrs.filter(parent_attr => parent_attr.idx < collapse_idx).map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).each(function(){
                    // Automatically collapse lower leveled table rows on its higher level sibling interaction
                    $(this).closest('tr').find(`th[scope='row'][data-collapseidx='${i}']`).attr('rowspan', 1);
                    //$(this).closest('tr').find(`th[scope='row']`).css('background-color', 'grey');
                    if (!$(this).hasClass('rotate-upside-down')) $(this).addClass('rotate-upside-down');
                    $(this).attr('data-expand', 0);
                });
            }
        });

        // Accessing this level table rows
        $(`tr[name=${parent_table_name}-row][${main_collapse_data_name}='${main_collapse_data_value}'][${target_data_name}='${target_data_val}']${parent_attrs.filter(parent_attr => parent_attr.idx <= collapse_idx).map(parent_attr => `[${parent_attr.name}='${parent_attr.value}']`).join('')}`).each(function(){
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