const AJAX_TIMEOUT_DURATION = 864000000;
const CUSTOMER_UID = 'e391c7cb-e9c7-ed11-b597-00224897d329';
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');
const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');

const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PROGRESS_BAR_DOM = $('div[name=request-loader-progress-bar]');
const ORDER_HISTORY_TABLE = $('table[name=order-history-table]');

const ORDER_DATE_FILTER_DROPDOWN = $('input[name="order-date-range"]');
const VENDOR_FILTER_DROPDOWN = $('ul[name=vendor-filter-opts]');
const CATEGORY_FILTER_DROPDOWN = $('ul[name=category-filter-opts]');
const SUBCATEGORY_FILTER_DROPDOWN = $('ul[name=sub-category-filter-opts]');
const BRAND_FILTER_DROPDOWN = $('ul[name=brand-filter-opts]');
const ORDER_STATUS_FILTER_DROPDOWN = $('ul[name=order-status-filter-opts]');
const PAYMENT_STATUS_FILTER_DROPDOWN = $('ul[name=payment-status-filter-opts]');
let product_filter_checkbox_func_names = '';
const FILTER_DROPDOWNS = [VENDOR_FILTER_DROPDOWN, CATEGORY_FILTER_DROPDOWN, SUBCATEGORY_FILTER_DROPDOWN, BRAND_FILTER_DROPDOWN, ORDER_STATUS_FILTER_DROPDOWN, PAYMENT_STATUS_FILTER_DROPDOWN];
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
    {'value': 1, 'label': 'Awaiting', 'colour': '#0067B9'},
    {'value': 2, 'label': 'Approved', 'colour': '#84BD00'},
    {'value': 3, 'label': 'Rejected', 'colour': 'red'},
    {'value': 4, 'label': 'Shipped', 'colour': '#FFCD00'},
    {'value': 5, 'label': 'Delivered', 'colour': '#F57F25'},
    {'value': 6, 'label': 'Cancelled', 'colour': '#B0008E'},
];

const PAYMENT_STATUS_FILTER_OPTS = [
    {'value': 0, 'label': 'Pending Payment', 'colour': '#0067B9'},
    {'value': 1, 'label': 'Payment Received', 'colour': '#84BD00'},
    {'value': 2, 'label': 'Order Refunded', 'colour': 'red'},
]

let brand_filter_options = [];
let category_filter_options = [];
let subcategory_filter_options = [];
let vendor_filter_options = [];
let week_of_yr_data = [];

let targeted_uom_order = undefined;
const CANCEL_ORDER_BTN = $('button[name=cancel-order-btn]');
const RETURN_ORDER_BTN = $('button[name=request-return-order-btn]');
const ST_WRONG_ORDER_BTN = $('button[name=st-wrong-order-btn]');
const ORDER_TICKET_FORM_MODAL = $('div[name=issue-order-ticket-modal]');
const ORDER_TICKET_TITLE_INPUT = $('input[name=order-issue-ticket-title-input]');
const ORDER_TICKET_DESC_INPUT = $('input[name=order-issue-ticket-desc-input]');

/*Util Functions*/
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
    if (!(new Date(`${min_date}`) <= new Date(`${input_date}`) && new Date(`${input_date}`) <= new Date(`${max_date}`))){
        console.log(new Date(`${min_date}`) <= new Date(`${input_date}`));
        console.log(new Date(`${max_date}`));
        console.log(new Date(`${input_date}`));
    }
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

function get_weeks_in_range(min_date, max_date) {
    const week_in_range = [];
    let curr_date = new Date(min_date);
  
    while (curr_date <= max_date) {
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
    //$('.progress-indicator').find('h6').text(`${curr_progress.toFixed(2)}%`);
}
/*End of Util functions*/


function render_filter_options(dropdown_container, filter_opts){
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


function render_order_history_data_row(sort_latest=true){
    if (sort_latest) FORMATTED_UOM_ORDERS = FORMATTED_UOM_ORDERS.sort((a, b) => new Date(b.createdon) - new Date(a.createdon));
    FORMATTED_UOM_ORDERS.forEach(formatted_uom_order => {
        if (formatted_uom_order.est_price < 1) return;
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
            data-orderstatuscode='${formatted_uom_order.order_status_code}' data-orderstatus='${formatted_uom_order.order_status}'
            data-paymentstatuscode='${formatted_uom_order.payment_status_code}' data-paymentstatus='${formatted_uom_order.payment_status}'
            data-requestuid='${formatted_uom_order.request_uid}' data-requestcode='${formatted_uom_order.request_code}'
        >
            <!--<td scope="row"><span class="material-symbols-rounded product-info-btn" name='product-info-btn'>info</span></td>-->
            <td scope="row">
                <div class='image-container' name='product-info-btn'>
                    <img src='${formatted_uom_order.thumbnail_img}'/>
                </div>
            </td>
            <td scope="row">${formatted_uom_order.order_code}</td>
            <td scope="row">${formatted_uom_order.product_name}</td>
            <td scope="row">${formatted_uom_order.vendor_name}</td>
            <td scope="row">${formatted_uom_order.stock_ordered}</td>
            <td scope="row" style='font-weight: 500;'>$${formatted_uom_order.est_price.toFixed(2)}</td>
            <td scope="row">${formatted_uom_order.createdon_str}</td>
            <td scope="row">${formatted_uom_order.payment_status}</td>
            <td scope="row">${formatted_uom_order.order_status}</td>
            <td hidden scope='row'><textarea class='product-remark-container' disabled hidden>${formatted_uom_order.product_remark}</textarea></td>
        </tr>`)
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
                return hide_elems_on_load(true);
            }
            const uom_requests = response['responseJSON'];
            const num_orders = get_sum_num_arr(response['responseJSON'].map(uom_request => uom_request.crcfc_num_orders));

            if (uom_requests.length < 1 || num_orders < 1){
            }

            $('div[name=spinner-resource-loader-container]').hide();
            $('div[name=progress-resource-loader-container]').show();
            let idx = 0;

            function retrieve_uom_orders(uom_request){
                function assign_ordered_product_info(product, formatted_uom_order){
                    formatted_uom_order['order_unit_code'] = product.prg_orderunit,
                    formatted_uom_order['order_unit_name'] = product['prg_orderunit@OData.Community.Display.V1.FormattedValue'],
                    formatted_uom_order['product_size'] = is_json_data_empty(product.prg_productsize) ? '' : product.prg_productsize,
                    formatted_uom_order['unit_size'] = product.prg_unitsize,
                    formatted_uom_order['category_uid'] = product['_prg_category_value'],
                    formatted_uom_order['category_name'] = product['_prg_category_value@OData.Community.Display.V1.FormattedValue'],
                    formatted_uom_order['subcategory_uid'] = product['_prg_subcategory_value'],
                    formatted_uom_order['subcategory_name'] = product['_prg_subcategory_value@OData.Community.Display.V1.FormattedValue'],
                    formatted_uom_order['brand_code'] = is_json_data_empty(product.prg_brand) ? -1 : product.prg_brand,
                    formatted_uom_order['brand_name'] = is_json_data_empty(product['prg_brand@OData.Community.Display.V1.FormattedValue']) ? 'No Brand' : product['prg_brand@OData.Community.Display.V1.FormattedValue'],
                    formatted_uom_order['trimmed_product_name'] = clean_white_space(product.prg_name.trim().toLowerCase()),
                    formatted_uom_order['product_barcode'] = is_json_data_empty(product.prg_unitbarcodes) ? '' : product.prg_unitbarcodes,
                    formatted_uom_order['thumbnail_img'] = is_json_data_empty(product.prg_img_url) ? PLACE_HOLDER_IMG_URL : product.prg_img_url,
                    formatted_uom_order['product_remark']= product.prg_remarks ?? '';
                    formatted_uom_order['bulk_order_unit_code'] = is_json_data_empty(product.prg_bulkorder) ? 0 : product.prg_bulkorder,
                    formatted_uom_order['bulk_order_unit_name'] = is_json_data_empty(product.prg_bulkorder) ? 'N/A' : product['prg_bulkorder@OData.Community.Display.V1.FormattedValue'],

                    FORMATTED_UOM_ORDERS.push(formatted_uom_order);
                }

                function _finalise_request(incr=true){
                    let is_loop = idx < num_orders - 1;
                    render_loading_progress_bar(is_loop ? (100 * idx) / num_orders : 99.9);
                    if (is_loop) return incr ? idx++ : idx;
                    
                    sleep(10000);
                    console.log(FORMATTED_UOM_ORDERS);

                    FORMATTED_UOM_ORDERS.forEach(uom_order => {
                        if (brand_filter_options.length < 0 || !brand_filter_options.map(item => item.value).includes(uom_order.brand_code)) brand_filter_options.push({'value': uom_order.brand_code, 'label': uom_order.brand_name});
                        if (subcategory_filter_options.length < 0 || !subcategory_filter_options.map(item => item.value).includes(uom_order.subcategory_uid)) subcategory_filter_options.push({'value': uom_order.subcategory_uid, 'label': uom_order.subcategory_name});
                        if (category_filter_options.length < 0 || !category_filter_options.map(item => item.value).includes(uom_order.category_uid)) category_filter_options.push({'value': uom_order.category_uid, 'label': uom_order.category_name});
                        if (vendor_filter_options.length < 0 || !vendor_filter_options.map(item => item.value).includes(uom_order.vendor_uid)) vendor_filter_options.push({'value': uom_order.vendor_uid, 'label': uom_order.vendor_name});
                        if (week_of_yr_data.length < 0 || !week_of_yr_data.map(item => item.value).includes(uom_order.week_of_year_str)) week_of_yr_data.push({'value': uom_order.week_of_year_str, 'label': uom_order.week_of_year_str});
                    });

                    const {min, max} = get_min_max_from_dt_arr(FORMATTED_UOM_ORDERS.map(uom_order => uom_order.createdon));
                    set_up_date_range_picker(ORDER_DATE_FILTER_DROPDOWN, min, max);

                    render_filter_options(BRAND_FILTER_DROPDOWN, brand_filter_options);
                    render_filter_options(CATEGORY_FILTER_DROPDOWN, category_filter_options);
                    render_filter_options(SUBCATEGORY_FILTER_DROPDOWN, subcategory_filter_options);
                    render_filter_options(VENDOR_FILTER_DROPDOWN, vendor_filter_options);
                    render_filter_options(ORDER_STATUS_FILTER_DROPDOWN, ORDER_STATUS_FILTER_OPTS);
                    render_filter_options(PAYMENT_STATUS_FILTER_DROPDOWN, PAYMENT_STATUS_FILTER_OPTS);

                    render_chart_js_content();
                    render_order_history_data_row();
                    hide_elems_on_load(true);
                }

                function format_uom_order(uom_order){
                    let formatted_uom_order = {
                        'order_code': `${uom_request.crcfc_requestcode}-${uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue']}`,
                        'order_code_trimmed': clean_white_space(`${uom_request.crcfc_requestcode}-${uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue']}`.trim().toLowerCase()),
                        'order_uid': uom_order.prg_uomprocurementorderid,
                        'vendor_map_uid': uom_order['_prg_vendorcode_value'],
                        'vendor_map_code': uom_order['_prg_vendorcode_value@OData.Community.Display.V1.FormattedValue'],
                        'request_uid': uom_request.crcfc_uomprocurementorderrequestid,
                        'request_code': uom_request.crcfc_requestcode,
                        'createdon_str': format_dt(new Date(uom_request.createdon)),
                        'createdon': uom_request.createdon,
                        'vendor_name': uom_order['_prg_vendor_value@OData.Community.Display.V1.FormattedValue'],
                        'vendor_uid': uom_order['_prg_vendor_value'],
                        'product_name': uom_order['_prg_product_value@OData.Community.Display.V1.FormattedValue'],
                        'product_uid': uom_order['_prg_product_value'],
                        'est_price': uom_order['crcfc_est_price'],
                        'stock_ordered': uom_order.prg_stockordered,
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

                        'week_of_year_str': date_to_week_str(uom_order.createdon),
                    };
                    $.ajax({
                        type: 'POST',
                        url: 'https://prod-25.australiasoutheast.logic.azure.com:443/workflows/45c876314ee44e57ac3a3ddfb77ce8e0/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=zeI80mSoOUMsp17egvcixDJJz-zumD_-E-mi0mR7TE4',
                        contentType: 'application/json',
                        accept: 'application/json;odata=verbose',
                        timeout: AJAX_TIMEOUT_DURATION,
                        async: true,
                        data: JSON.stringify({'product_uid': formatted_uom_order.product_uid}),
                        complete: function(response, status, xhr){
                            if (String(status) !== 'success') return _finalise_request(true);
                            assign_ordered_product_info(response['responseJSON'], formatted_uom_order);
                            _finalise_request(true);
                    }});
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
                        uom_orders.forEach((uom_order, uom_order_idx) => {
                            (function(y) {
                                setTimeout(function() {
                                    format_uom_order(uom_order);
                                    }, y * 350);
                                }(uom_order_idx));
                        });
                        //format_uom_orders(uom_orders);
                    }
                });
            }

            render_loading_progress_bar(0);
            uom_requests.forEach(uom_request => {
                (function(y) {
                    setTimeout(function() {
                        retrieve_uom_orders(uom_request);
                        }, y * 600);
                    }(idx));
            });
            
        }
    });
}


function render_chart_js_content(no_filter=true){
    $('section[name=order-stat-container-section]').find('.removable-item').each(function(){
        $(this).remove();
    });

    const filtered_vendors = get_selected_filter_values(`${VENDOR_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_categories = get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_subcategories = get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
    const filtered_brands = get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
    const filtered_payment_opts = get_selected_filter_values(`${PAYMENT_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
    const filtered_order_opts = get_selected_filter_values(`${ORDER_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
    let {min_date, max_date} = get_daterange_input_val(ORDER_DATE_FILTER_DROPDOWN);
    const filtered_week_of_year_arr = get_weeks_in_range(min_date, max_date);

    const searched_txt = !$('input[name=product-search-input-field]').val() || is_whitespace($('input[name=product-search-input-field]').val()) ? '' : clean_white_space($('input[name=product-search-input-field]').val().toLowerCase().trim());

    let filtered_uom_orders = no_filter ? FORMATTED_UOM_ORDERS : FORMATTED_UOM_ORDERS.filter(uom_order => 
        (uom_order.trimmed_product_name.includes(searched_txt) || uom_order.order_code_trimmed.includes(searched_txt)) &&
        filtered_subcategories.includes(uom_order.subcategory_uid) && filtered_categories.includes(uom_order.category_uid) &&
        filtered_vendors.includes(uom_order.vendor_uid) &&
        filtered_brands.includes(uom_order.brand_code) &&
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
    const payment_status_stat_canvas = `<canvas id='payment_status_stat_canvas' class='pm-stat-item'></canvas>`;
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
                    hoverOffset: 4,
                    type: 'line',
                    yAxisID: 'spent',
                    
                },
                {
                    label: 'Number of orders',
                    data: vendor_filter_options.map(item => filtered_uom_orders.filter(uom_order => uom_order.vendor_uid === item.value).length),
                    hoverOffset: 4,
                    backgroundColor: ['#bfd9ee'],
                    borderColor: ['#bfd9ee'],
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
                    beginAtZero: true,
                    position: 'left',
                    y: {
                        title: {
                            display: true,
                            text: 'Number of orders'
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
                    label: 'Number of orders',
                    data: category_filter_options.map(item => filtered_uom_orders.filter(uom_order => uom_order.category_uid === item.value).length),
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
                            text: 'Number of orders'
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
                    label: 'Number of orders',
                    data: subcategory_filter_options.map(item => filtered_uom_orders.filter(uom_order => uom_order.subcategory_uid === item.value).length),
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
                            text: 'Number of orders'
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
                    label: 'Number of orders',
                    data: week_of_yr_data.map(item => filtered_uom_orders.filter(uom_order => uom_order.week_of_year_str === item.value && filtered_week_of_year_arr.includes(uom_order.week_of_year_str)).length),
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
                            text: 'Number of orders'
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

function sort_items(sort_radio_dom){
    const _this_id = sort_radio_dom.attr('id');
    const _data_row = $(`tr[name=${ORDER_HISTORY_TABLE.attr('name')}-row]`);
    if (_this_id == 'sort-by-product-name-asc'){
        _data_row.sort(function(a, b){
            return $(a).attr('data-productname').localeCompare($(b).attr('data-productname'))
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if (_this_id == 'sort-by-product-name-desc'){
        _data_row.sort(function(a, b){
            return $(b).attr('data-productname').localeCompare($(a).attr('data-productname'))
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if(_this_id == 'sort-by-price-asc'){
        _data_row.sort(function(a, b){
            return parseFloat($(a).attr('data-spent')) - parseFloat($(b).attr('data-spent'));
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if(_this_id == 'sort-by-price-desc'){
        _data_row.sort(function(a, b){
            return parseFloat($(b).attr('data-spent')) - parseFloat($(a).attr('data-spent'));
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if(_this_id == 'sort-by-quantity-asc'){
        _data_row.sort(function(a, b){
            return parseInt($(a).attr('data-stockordered')) - parseInt($(b).attr('data-stockordered'));
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if(_this_id == 'sort-by-quantity-desc'){
        _data_row.sort(function(a, b){
            return parseInt($(b).attr('data-stockordered')) - parseInt($(a).attr('data-stockordered'));
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if(_this_id == 'sort-by-createdon-desc'){
        _data_row.sort(function(a, b){
            return to_datetime($(b).attr('data-createdon')) - to_datetime($(a).attr('data-createdon'));
        }).appendTo(ORDER_HISTORY_TABLE);
    }else if(_this_id == 'sort-by-createdon-asc'){
        _data_row.sort(function(a, b){
            return to_datetime($(a).attr('data-createdon')) - to_datetime($(b).attr('data-createdon'));
        }).appendTo(ORDER_HISTORY_TABLE);
    }
}


$(document).ready(function(){
    hide_elems_on_load();
    render_body_content();


    //Filter function
    $(document).on('keyup change', `${product_filter_checkbox_func_names}, input[name=sort-option-radio-checkbox], input[name=product-search-input-field]`, function(event){
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
        const filtered_categories = get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_subcategories = get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_brands = get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
        const filtered_payment_opts = get_selected_filter_values(`${PAYMENT_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);
        const filtered_order_opts = get_selected_filter_values(`${ORDER_STATUS_FILTER_DROPDOWN.attr('name')}-checkbox`, true);

        const searched_txt = !$('input[name=product-search-input-field]').val() || is_whitespace($('input[name=product-search-input-field]').val()) ? '' : clean_white_space($('input[name=product-search-input-field]').val().toLowerCase().trim());
        let {min_date, max_date} = get_daterange_input_val(ORDER_DATE_FILTER_DROPDOWN);
        //console.log(ORDER_DATE_FILTER_DROPDOWN.start);

        ORDER_HISTORY_TABLE.find('.data-row').each(function(){
            $(this).toggle(($(this).attr('data-productnametrimmed').includes(searched_txt) || $(this).attr('data-ordercodetrimmed').includes(searched_txt)) &&
                            filtered_vendors.includes($(this).attr('data-vendoruid')) &&
                            filtered_categories.includes($(this).attr('data-categoryuid')) &&
                            filtered_subcategories.includes($(this).attr('data-subcategoryuid')) &&
                            filtered_brands.includes(parseInt($(this).attr('data-brandcode'))) &&
                            filtered_payment_opts.includes(parseInt($(this).attr('data-paymentstatuscode'))) &&
                            filtered_order_opts.includes(parseInt($(this).attr('data-orderstatuscode'))) &&
                            is_within_datetime_range($(this).attr('data-createdon'), min_date, max_date)
                        );
        });
        render_chart_js_content(false);
        sort_items($('input[name=sort-option-radio-checkbox]:checked'));

        disable_button(CLEAR_FILTER_BTN, false);
        disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        disable_button(CLEAR_FILTER_BTN, true, BSTR_BORDER_SPINNER);
        disable_button(APPLY_FILTER_BTN, true);

        ORDER_HISTORY_TABLE.find('.data-row').each(function(){
            $(this).toggle(true);
        });
        sort_items($('#sort-by-createdon-desc'));
        render_chart_js_content();

        $('input[name=product-search-input-field]').val(null);
        $(document).find('.form-check-input').prop('checked', false);
        $(document).find('.form-check-input').attr('checked', false);
        ORDER_DATE_FILTER_DROPDOWN.val(`${parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('min')), true)} - ${parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('max')), true)}`);

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
        //console.log("A new date selection was made: " + start.format('DD/MM/YYYY') + ' to ' + end.format('DD/MM/YYYY'));
        /*if (!APPLY_FILTER_BTN.prop('disabled')) return;
        disable_button(APPLY_FILTER_BTN, parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('min')), true) === start.format('DD/MM/YYYY') && parse_dt_str_and_obj(new Date(ORDER_DATE_FILTER_DROPDOWN.attr('max')), true) === end.format('DD/MM/YYYY'))
        disable_button(CLEAR_FILTER_BTN, APPLY_FILTER_BTN.prop('disabled'));*/
    });


    // Modal functions
    $(document).on('click', '.close-modal-btn', function(event){
        if ($('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        $(this).closest('.modal').modal('hide');
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
            const allow_issue = (new Date() - new Date(`${most_recent_update_on}`)) / (1000 * 60 * 60 * 24 * 30) <= 3;

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

    CANCEL_ORDER_BTN.on('click', function(event){
        if (targeted_uom_order === undefined || $('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        render_ticket_form_modal(`Order ${targeted_uom_order.order_code} cancelation`, targeted_uom_order, 6, 2);
    });

    RETURN_ORDER_BTN.on('click', function(event){
        if (targeted_uom_order === undefined || $('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        render_ticket_form_modal(`Order ${targeted_uom_order.order_code} return`, targeted_uom_order, 7, targeted_uom_order.payment_status_code);
    });

    ST_WRONG_ORDER_BTN.on('click', function(event){
        if (targeted_uom_order === undefined || $('button[name=send-order-ticket-btn]').attr('data-sendingrequest') === '1') return;
        render_ticket_form_modal(`Order ${targeted_uom_order.order_code} other issues`, targeted_uom_order, targeted_uom_order.order_status_code, targeted_uom_order.payment_status_code);
    });

    //Submit Order Issue Ticket
    $('button[name=send-order-ticket-btn]').on('click', function(event){
        const this_btn = $(this);
        this_btn.attr('data-sendingrequest', 1);
        const parent_form = ORDER_TICKET_FORM_MODAL.find('.modal-body').eq(0).find('form').eq(0)

        ORDER_TICKET_TITLE_INPUT.attr('disabled', true);
        ORDER_TICKET_DESC_INPUT.attr('disabled', true);
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
                ORDER_TICKET_DESC_INPUT.attr('disabled', false);

                if (String(status) !== 'success') return alert('Failed to submit a ticket at this time');
                if ([504].includes(response.status)) return alert('Request timed out, please try again later');
                alert(`A ticket with ID ${response['responseJSON']['crcfc_uomprocurementserviceorderticketid']} has been successfully submited`);
                ORDER_TICKET_FORM_MODAL.modal('hide');
            }
        });
    });
});