const AJAX_TIMEOUT_DURATION = 864000000;
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');
const LOAD_MORE_BTN = $('button[name=load-more-btn]');
const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');
const APPLY_PRODUCT_INFO_CHANGES_BTN = $('button[name=apply-order-info-changes-btn]');

const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PROGRESS_BAR_DOM = $('div[name=request-loader-progress-bar]');
const PRODUCT_VENDOR_MAP_TABLE = $('table[name=product-vendor-map-table]');

const VENDOR_FILTER_DROPDOWN = $('ul[name=vendor-filter-opts]');
const CATEGORY_FILTER_DROPDOWN = $('ul[name=category-filter-opts]');
const SUBCATEGORY_FILTER_DROPDOWN = $('ul[name=sub-category-filter-opts]');
const BRAND_FILTER_DROPDOWN = $('ul[name=brand-filter-opts]');

let product_filter_checkbox_func_names = '';
const FILTER_DROPDOWNS = [VENDOR_FILTER_DROPDOWN, CATEGORY_FILTER_DROPDOWN, SUBCATEGORY_FILTER_DROPDOWN, BRAND_FILTER_DROPDOWN];
FILTER_DROPDOWNS.forEach((dropdown, idx) => {
    product_filter_checkbox_func_names += `input[name=${dropdown.attr('name')}-checkbox]${idx < FILTER_DROPDOWNS.length - 1 ? ', ' : ''}`;
});

let vendor_filter_options = [];
let brand_filter_options = [{'value': -1, 'label': 'No Brand'}];
let category_filter_options = [];
let subcategory_filter_options = [];
let VENDORS = [];
let CHOSEN_VENDOR = undefined;
let UOM_PRODUCT_UIDS = [];
let UOM_PRODUCT_VENDOR_MAPS = [];
const DISABLED_ELEM_CLASS = 'disabled-element';
const ERR_INPUT_INDICATOR_CLASS = 'red-outline';
const MAX_RECORD_NUM = 1000;
let CURR_PAGE_NUM = 1;

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
    const target_elems = elem_markup ?? $('div[name=mass-order-status-selection-opt-container]');
    disabled ? target_elems.addClass(DISABLED_ELEM_CLASS) : target_elems.removeClass(DISABLED_ELEM_CLASS);
}

function _format_vendor_stock_remained(stock_on_hand, stock_ordered){
    const stock_remained = stock_on_hand - stock_ordered;
    return stock_remained >= 0 ? `${stock_remained} remained` : `${Math.abs(stock_remained)} required`;
}

function make_load_more_product_vendor_map_btn_markup(vendor_map_group, format_mapping){
    return `${vendor_map_group.length} ${format_mapping.has_next ? 'loaded' : vendor_map_group.length > 1 ? 'products' : 'product'}<br>
    ${format_mapping.has_next ? `<span class="material-symbols-rounded inner-load-more-data-row-btn" data-vendoruid='${format_mapping.vendor_uid}' name='load-more-product-vendor-map-btn'>shelf_auto_hide</span>` : ''}`;
}

function make_product_vendor_map_row_markup(target_table, format_mapping){
    return `
    <tr class='data-row' name='${target_table.attr('name')}-row'
                    data-productuid='${format_mapping.product_uid}' data-productname='${format_mapping.product_name}' data-productnametrimmed='${format_mapping.product_trimmed_name}' data-productbarcode='${format_mapping.product_barcode}' data-thumbnailimg='${format_mapping.thumbnail_img}'
                    data-minquantity='${format_mapping.min_quantity}' data-orderunitcode='${format_mapping.order_unit_code}' data-orderunitname='${format_mapping.order_unit_name}'
                    data-productsize='${format_mapping.product_size}' data-unitsize='${format_mapping.unit_size}' 
                    data-bulkorderunitcode='${format_mapping.bulk_order_unit_code}' data-bulkorderunitname='${format_mapping.bulk_order_unit_name}'
                    data-categoryuid='${format_mapping.category_uid}' data-categoryname='${format_mapping.category_name}'
                    data-subcategoryuid='${format_mapping.subcategory_uid}' data-subcategoryname='${format_mapping.subcategory_name}'
                    data-brandcode='${format_mapping.brand_code}' data-brandname='${format_mapping.brand_name}'
                    data-vendoruid='${format_mapping.vendor_uid}' data-vendorname='${format_mapping.vendor_name}'  
                    data-vendormapcode='${format_mapping.vendor_map_code}' data-vendormapuid='${format_mapping.vendor_map_uid}'
                    data-vendorstockonhand='${format_mapping.vendor_stock_on_hand}'
                    data-vendorprice='${format_mapping.vendor_price}' 
                    data-isactive='${format_mapping.is_active ? 1 : 0}'
                >
                <td><input maxlength='800' class='long-txt-edit-field border-effect' type='text' placeholder='${format_mapping.vendor_map_code}' name="vendor-map-code-input-field" value='${format_mapping.vendor_map_code}'/></td>
                <td style='min-width: 28ch;'>${format_mapping.product_name}</td>
                <td><input maxlength='10000' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${format_mapping.vendor_stock_on_hand}' name="stock-on-hand-input-field" value='${format_mapping.vendor_stock_on_hand}'/></td>
                <td style='min-width: 8ch;'><input maxlength='10' class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${0}' name="vendor-price-input-field" value='${0}'/></td>
                <td><div class="form-check form-switch"><input class="form-check-input item-active-state-switch" type="checkbox" name='item-active-state-switch' ${format_mapping.is_active ? 'checked' : ''}></div></td>
                <td style='min-width: 28ch;'>${format_mapping.category_name}</td>
                <td style='min-width: 28ch;'>${format_mapping.subcategory_name}</td>
                <td style='min-width: 15ch;'>${format_mapping.brand_name}</td>
                <td style='min-width: 20ch;'>${format_mapping.product_barcode}</td>
                <td style='min-width: 10ch;'>${format_mapping.product_size}</td>
                <td style='min-width: 10ch;'>${format_mapping.order_unit_name}</td>
                <td>${format_mapping.min_quantity}</td>
                <td style='min-width: 10ch;'>${format_mapping.bulk_order_unit_name}</td>
    </tr>
    `;
}


function format_product_vendor_map(json_mapping, vendor_info){
    return sanitise_json_obj({
        'odata_id': json_mapping['@odata.id'],
        'product_uid': json_mapping.prg_uomprocurementserviceproductsid,
        'product_barcode': is_json_data_empty(json_mapping['prg_unitbarcodes']) ? '' : json_mapping['prg_unitbarcodes'],
        'product_name': json_mapping['prg_name'],
        'product_trimmed_name': clean_white_space(json_mapping['prg_name'].trim().toLowerCase()),
        'thumbnail_img': is_json_data_empty(json_mapping['prg_img_url']) ? PLACE_HOLDER_IMG_URL : json_mapping['prg_img_url'],
        'remark': json_mapping['prg_remarks'] ?? '',
        'min_quantity': json_mapping['prg_minorderquantity'],
        'order_unit_code': json_mapping['prg_orderunit'],
        'order_unit_name': json_mapping['prg_orderunit@OData.Community.Display.V1.FormattedValue'],
        'product_size': is_json_data_empty(json_mapping['prg_productsize']) ? '' : json_mapping['prg_productsize'],
        'unit_size': json_mapping['prg_unitsize'],
        'category_uid': json_mapping['_prg_category_value'],
        'category_name': json_mapping['_prg_category_value@OData.Community.Display.V1.FormattedValue'],
        'subcategory_uid': json_mapping['_prg_subcategory_value'],
        'subcategory_name': json_mapping['_prg_subcategory_value@OData.Community.Display.V1.FormattedValue'],
        'brand_code': is_json_data_empty(json_mapping['_prg_brand_value']) ? -1 : json_mapping['_prg_brand_value'],
        'brand_name': is_json_data_empty(json_mapping['_prg_brand_value@OData.Community.Display.V1.FormattedValue']) ? 'No Brand' : json_mapping['_prg_brand_value@OData.Community.Display.V1.FormattedValue'],
        'vendor_uid': vendor_info.vendor_uid,
        'vendor_name': vendor_info.vendor_name,
        'vendor_map_code': '',
        'vendor_map_uid': '',
        'vendor_stock_on_hand': 0,
        'vendor_stock_ordered': 0,
        'vendor_price': json_mapping.prg_price_base,
        'total_spent': parseFloat(json_mapping.prg_price_base * json_mapping.prg_stockorderd).toFixed(2),
        'bulk_order_unit_code': is_json_data_empty(json_mapping['prg_bulkorder']) ? 0 : json_mapping['prg_bulkorder'],
        'bulk_order_unit_name': is_json_data_empty(json_mapping['prg_bulkorder']) ? 'N/A' : json_mapping['prg_bulkorder@OData.Community.Display.V1.FormattedValue'],
        'is_active': false,
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

function _split_searched_results(searched_input_dom){
    if (is_whitespace(searched_input_dom.val())) return[''];
    const searched_txt = clean_white_space(searched_input_dom.val().trim().toLowerCase());
    const searched_vals = searched_txt.split(';;');
    if (searched_vals.length < 1 || is_whitespace(searched_txt)) return [''];
    return searched_vals.filter(searched_val => !is_whitespace(searched_val));
}
/*End of Util functions*/


function render_filter_options(dropdown_container, filter_opts, sort_by_label=false, is_checkbox=true){
    if (sort_by_label) filter_opts = filter_opts.sort((a, b) => a.label.localeCompare(b.label));
    filter_opts.forEach(filter_opt => {
        dropdown_container.append(`
        <div class='dropdown-item order-attr-filter-opt-container'>
            <input class='form-check-input filter-opt-radio' type='${is_checkbox ? 'checkbox' : 'radio'}' name='${dropdown_container.attr('name')}-checkbox'
                    data-label='${DOMPurify.sanitize(filter_opt.label)}' data-value='${filter_opt.value}' data-parentul='${dropdown_container.attr('name')}'>
            <label class='form-check-label'>${DOMPurify.sanitize(filter_opt.label)}</label>
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
        }, success: function(response, status, xhr){
            sanitise_json_obj(response.vendors).forEach(vendor => {
                vendor_filter_options.push({
                    'value': vendor.prg_uomprocurementvendorid,
                    'label': vendor.prg_name,
                });
                VENDORS.push({
                    'vendor_uid': vendor.prg_uomprocurementvendorid,
                    'vendor_name': vendor.prg_name,
                    'vendor_name_trimmed': clean_white_space(vendor.prg_name.trim().toLowerCase()),
                    'curr_page_num': 1,
                    'is_loading_more': false,
                    'odataid': vendor['@odata.id'],
                });
            });
            sanitise_json_obj(response.brands).forEach(brand => {
                brand_filter_options.push({'label': brand.prg_name, 'value': brand.prg_ggorderbrandid});
            });

            sanitise_json_obj(response.sub_categories).forEach(sub_category => {
                subcategory_filter_options.push({'label': sub_category.prg_name, 'value': sub_category.prg_uomprocurementservicesubcatgeoryid});
            });

            sanitise_json_obj(response.categories).forEach(category => {
                category_filter_options.push({'label': category.prg_name, 'value': category.prg_uomprocurementservicecategoriesid});
            });

            render_filter_options(VENDOR_FILTER_DROPDOWN, vendor_filter_options, true, false);
            render_filter_options(BRAND_FILTER_DROPDOWN, brand_filter_options);
            render_filter_options(CATEGORY_FILTER_DROPDOWN, category_filter_options);
            render_filter_options(SUBCATEGORY_FILTER_DROPDOWN, subcategory_filter_options);

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


$(document).ready(function(){
    LOAD_MORE_BTN.toggle(false);
    hide_elems_on_load();
    render_body_content();

    //Filter function
    $(document).on('keyup change', `${product_filter_checkbox_func_names}, input[name=sort-option-radio-checkbox], input[name=vendor-search-input-field]`, function(event){
        let no_filter = true;
        FILTER_DROPDOWNS.forEach(dropdown => {
            no_filter = no_filter && $(`input[name=${dropdown.attr('name')}-checkbox]:checked`).length < 1;
        });
        disable_button(CLEAR_FILTER_BTN, !$('input[name=product-search-input-field]').val() && $('input[name=sort-option-radio-checkbox]:checked').length < 1 && no_filter);
        disable_button(APPLY_FILTER_BTN, VENDOR_FILTER_DROPDOWN.find(`input[type='radio']:checked`).length !== 1);
    });

    function ready_loading_query(complete=false, load_more=false){
        disable_filter_elements(!complete);
        if (!load_more) $('.content-section.order-history-content-section').toggle(complete);
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN);
    }

    function process_filter_opts(){
        const filtered_vendor_opt = VENDOR_FILTER_DROPDOWN.find(`input[type='radio']:checked`).attr('data-value');

        const searched_products = _split_searched_results(PRODUCT_SEARCH_TEXT_FIELD);//[undefined, null].includes(PRODUCT_SEARCH_TEXT_FIELD.val()) ? '' : PRODUCT_SEARCH_TEXT_FIELD.val();
        let filtered_brand_opts =  get_selected_filter_values(`${BRAND_FILTER_DROPDOWN.attr('name')}-checkbox`);
        if (filtered_brand_opts.indexOf('-1') !== -1) {
            // Replace '-1' with null
            filtered_brand_opts = filtered_brand_opts.map(function(item) {
                return item === '-1' ? null : item;
            });
        }
        const filtered_category_opts =  get_selected_filter_values(`${CATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        const filtered_subcategory_opts =  get_selected_filter_values(`${SUBCATEGORY_FILTER_DROPDOWN.attr('name')}-checkbox`);
        
        const filtered_vendors = VENDORS.filter(vendor => filtered_vendor_opt === vendor.vendor_uid);

        const filtered_category_xml_query = `
        <link-entity name="prg_uomprocurementservicecategories" from="prg_uomprocurementservicecategoriesid" to="prg_category" alias="category">
            <filter type="and">
                <condition attribute="prg_uomprocurementservicecategoriesid" operator="in">
                    ${filtered_category_opts.map(data => `<value>${data}</value>`).join('\n')}
                </condition>
            </filter>
        </link-entity>`;
        const filtered_subcategory_xml_query = `
        <link-entity name="prg_uomprocurementservicesubcatgeory" from="prg_uomprocurementservicesubcatgeoryid" to="prg_subcategory" alias="subcategory">
            <filter type="and">
                <condition attribute="prg_uomprocurementservicesubcatgeoryid" operator="in">
                    ${filtered_subcategory_opts.map(data => `<value>${data}</value>`).join('\n')}
                </condition>
            </filter>
        </link-entity>`;
        const filtered_product_name_xml_query = `
        ${searched_products.length < 1 ? '' : 
        `<filter type="or">${str_arr_escape_xml(searched_products).map(searched_product => `<condition attribute="prg_name_trimmed" operator="like" value="%${searched_product}%"/>`).join('\n')}</filter>`}`;

        const filtered_brand_xml_query = filtered_brand_opts.includes(null) ? `
        <link-entity name="prg_ggorderbrand" from="prg_ggorderbrandid" to="prg_brand" alias="brand" link-type="outer">
                <filter type="or">
                    <condition attribute="prg_ggorderbrandid" operator="in">
                        ${filtered_brand_opts.filter(data => data !== null).map(data => `<value>${data}</value>`).join('\n')}
                    </condition>
                    <condition attribute="prg_ggorderbrandid" operator="null" />
                </filter>
        </link-entity>` :
        `<link-entity name="prg_ggorderbrand" from="prg_ggorderbrandid" to="prg_brand" alias="brand">
            <filter type="and">
                <condition attribute="prg_ggorderbrandid" operator="in">
                    ${filtered_brand_opts.map(data => `<value>${data}</value>`).join('\n')}
                </condition>
            </filter>
        </link-entity>`;
        return {'filtered_vendors': filtered_vendors, 
                'filtered_category_xml_query': filtered_category_xml_query,
                'filtered_subcategory_xml_query': filtered_subcategory_xml_query,
                'filtered_product_name_xml_query': filtered_product_name_xml_query,
                'filtered_brand_xml_query': filtered_brand_xml_query};
    }

    $(`button[name=${APPLY_FILTER_BTN.attr('name')}], button[name=${LOAD_MORE_BTN.attr('name')}]`).on('click', function(event){
        const this_btn = $(this);
        const is_loading_more = this_btn.attr('name') === LOAD_MORE_BTN.attr('name');

        const {
            filtered_vendors,
            filtered_category_xml_query,
            filtered_subcategory_xml_query,
            filtered_product_name_xml_query,
            filtered_brand_xml_query,
        } = process_filter_opts();
        if (!is_loading_more){
            CHOSEN_VENDOR = VENDORS.filter(vendor => vendor.vendor_uid === filtered_vendors[0]['vendor_uid'])[0];
        }
        if (filtered_vendors.length < 1 || CURR_PAGE_NUM < 1 || CHOSEN_VENDOR === undefined) return;
        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(this_btn, true, BSTR_BORDER_SPINNER);

        ready_loading_query(false, is_loading_more);

        function _complete_request(){
            ready_loading_query(true, is_loading_more);
            disable_button(CLEAR_FILTER_BTN, false);
            disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');
            disable_button(LOAD_MORE_BTN, CURR_PAGE_NUM < 1, 'Load More');
            LOAD_MORE_BTN.toggle(CURR_PAGE_NUM >= 1);
            disable_filter_elements(true, $('.order-attr-filter-opt-container'));
        }

        function retrieve_product_vendor_map(filtered_vendor){
            $.ajax({
                type: 'POST',
                url: 'https://prod-29.australiasoutheast.logic.azure.com:443/workflows/b0e1105b0d1141dea17c9a0b6a12443a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N_0Zckna40QBTKUkRUPvfKPfXieM3hj1Q3tLeDdoMtE',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({'vendor_uid': filtered_vendor.vendor_uid, 
                                        'filtered_brand_xml_query': filtered_brand_xml_query, 
                                        'filtered_product_name_xml_query': filtered_product_name_xml_query, 
                                        'filtered_subcategory_xml_query': filtered_subcategory_xml_query, 
                                        'filtered_category_xml_query': filtered_category_xml_query,
                                        'page_num': CURR_PAGE_NUM,
                                        'num_items': MAX_RECORD_NUM}),
                complete: function(response, status, xhr){
                    _complete_request();
                },
                success: function(response, status, xhr){
                    response.mappings.forEach(mapping => {
                        const formatted_mapping = format_product_vendor_map(mapping, filtered_vendor);
                        const _mark_up = make_product_vendor_map_row_markup(PRODUCT_VENDOR_MAP_TABLE, formatted_mapping)
                        UOM_PRODUCT_VENDOR_MAPS.push(formatted_mapping);
                        PRODUCT_VENDOR_MAP_TABLE.find('tbody').append(_mark_up);
                    });
                    CURR_PAGE_NUM = response.has_next ? CURR_PAGE_NUM + 1 : 0;
                }
            });
        }


        disable_filter_elements(true, $('.order-attr-filter-opt-container'));
        retrieve_product_vendor_map(CHOSEN_VENDOR);
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        $('input[name=product-search-input-field]').val(null);
        $(document).find('.form-check-input').prop('checked', false);
        $(document).find('.form-check-input').attr('checked', false);

        ready_loading_query();
        $('div[name=progress-resource-loader-container]').toggle(false);
        disable_filter_elements(false);

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, true);
        disable_button(LOAD_MORE_BTN, true);
        LOAD_MORE_BTN.toggle(false);
        CURR_PAGE_NUM = 1;
        UOM_PRODUCT_VENDOR_MAPS = [];
        PRODUCT_VENDOR_MAP_TABLE.find('tbody').empty();
        CHOSEN_VENDOR = undefined;

        disable_filter_elements(false, $('.order-attr-filter-opt-container'));
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

    function expand_data_rows(collapse_btn, parent_table_name, target_data_name, target_uid, expand=true){
        collapse_btn.attr('data-expand', expand ? 0 : 1);
        const row_span = expand ? '1' : collapse_btn.attr('data-rowspan');
        expand ? collapse_btn.addClass('rotate-upside-down') : collapse_btn.removeClass('rotate-upside-down');
        $(document).find(`tr[name=${parent_table_name}-row][${target_data_name}='${target_uid}'][data-isfirstidx='1']`).find('th').attr('rowspan', row_span);
        expand ? $(document).find(`tr[name=${parent_table_name}-row][${target_data_name}='${target_uid}'][data-isfirstidx='0']`).hide() : $(document).find(`tr[name=${parent_table_name}-row][${target_data_name}='${target_uid}'][data-isfirstidx='0']`).show();
    }


    $(document).on('click', 'span[name=collapse-vendor-group-btn]', function(event){
        const parent_table = $(this).closest('table');
        expand_data_rows($(this), parent_table.attr('name'), $(this).attr('data-targetdata'), $(this).attr('data-vendoruid'), $(this).attr('data-expand') === '1');
    });

    // Product Vendor Map Attribute Edit text field event function
    function verify_valid_info_fields(parent_table_name){
        let is_valid = true;
        function _invalidate_input(input_field){
            is_valid = false;
            input_field.addClass(ERR_INPUT_INDICATOR_CLASS);
        }
        function _revalidate_input(input_field){
            if (input_field.hasClass(ERR_INPUT_INDICATOR_CLASS)) input_field.removeClass(ERR_INPUT_INDICATOR_CLASS);
        }
        function _process_inactive_elem(parent_tr){
            parent_tr.find('input[name=vendor-map-code-input-field], .product-quantity-input-field').each(function(){
                _revalidate_input($(this));
            });
        }

        // Check for null value
        $('.long-txt-edit-field, .product-quantity-input-field').each(function(){
            if (!$(this).val() || is_whitespace($(this).val())) _invalidate_input($(this));
        });

        group_arr_of_objs(UOM_PRODUCT_VENDOR_MAPS, 'vendor_uid').forEach(vendor_grouped_data => {
            let non_dupl_vendor_map_codes = [];
            $(`tr[name=${parent_table_name}-row][data-vendoruid='${vendor_grouped_data.key}']`).each(function(){
                if ($(this).find('input[name=item-active-state-switch]').prop('checked') === false) return _process_inactive_elem($(this));

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
            if ($(this).closest('tr').find('input[name=item-active-state-switch]').prop('checked') === false) return _process_inactive_elem($(this).closest('tr'));
            if (!$(this).val() || is_whitespace($(this).val())) return _invalidate_input($(this));
            let curr_value = $(this).val();
            const is_int = $(this).attr('name') === 'stock-on-hand-input-field';
            curr_value = is_int ? parseInt(curr_value.replace(/\D/g, '')) : parseFloat(curr_value.replace(/[^-?0-9.]/g, ''));
            if (isNaN(curr_value)) _invalidate_input($(this));
            const max = 1000000;
            const min =  0;
            if (curr_value <= min || curr_value > max) _invalidate_input($(this));
        });

        return is_valid;
    }

    $(document).on('keyup change', '.item-active-state-switch', function(event){
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    $(document).on('blur', '.long-txt-edit-field, .product-quantity-input-field', function(event){
        if (!$(this).val() || is_whitespace($(this).val())) $(this).val($(this).attr('placeholder'));
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', '.long-txt-edit-field, .product-quantity-input-field', function(event){
        remove_input_red_color($(this));
    });

    $(document).on('change keyup blur', '.long-txt-edit-field', function(event){
        if (!$(this).val() || is_whitespace($(this).val())) return disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true);
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    
    $(document).on('blur keyup', '.product-quantity-input-field', function(event){
        remove_input_red_color($(this));
        const parent_tr = $(this).closest('tr');
        const is_int = $(this).attr('name') === 'stock-on-hand-input-field';
        const max = 1000000;
        const min =  0;
        const valid_input = verify_number_input($(this), is_int, min, max);
        //if (valid_input && $(this).attr('name') === 'stock-on-hand-input-field') parent_tr.find('td[name=stock-remained-txt-container]').text(_format_vendor_stock_remained(parseInt($(this).val()), parseInt(parent_tr.attr('data-vendorstockordered'))));
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    APPLY_PRODUCT_INFO_CHANGES_BTN.on('click', function(event){
        function _ready_elem_for_changes(complete=false){
            if (complete) disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true, 'Apply Changes');
            disable_filter_elements(!complete, $(`.long-txt-edit-field, .product-quantity-input-field, .form-check-input, div[name=mass-order-status-selection-opt-container], .inner-load-more-data-row-btn`));
            if (CURR_PAGE_NUM >= 1){
                LOAD_MORE_BTN.toggle(complete);
                disable_button(LOAD_MORE_BTN, !complete);
            }
        }
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true, BSTR_BORDER_SPINNER);
        _ready_elem_for_changes();

        let sent_datas = [];
        PRODUCT_VENDOR_MAP_TABLE.find('tbody').find('tr').each(function(event){
            if (!$(this).find('input[name=vendor-map-code-input-field]').val() || is_whitespace($(this).find('input[name=vendor-map-code-input-field]').val())
                || !$(this).find('input[name=stock-on-hand-input-field]').val() || is_whitespace($(this).find('input[name=stock-on-hand-input-field]').val())
                || !$(this).find('input[name=vendor-price-input-field]').val() || is_whitespace($(this).find('input[name=vendor-price-input-field]').val())) return;
            const vendor_price = parseFloat(($(this).find('input[name=vendor-price-input-field]').val()));
            const stock_on_hand = parseInt(($(this).find('input[name=stock-on-hand-input-field]').val()));
            const corresponding_product = UOM_PRODUCT_VENDOR_MAPS.filter(product => product.product_uid === $(this).attr('data-productuid'))[0];
            if (vendor_price <= 0 || stock_on_hand < 1 || corresponding_product === undefined) return;

            sent_datas.push({
                'odata_id': corresponding_product.odata_id,
                'product_uid': $(this).attr('data-productuid'),
                'vendor_code': $(this).find('input[name=vendor-map-code-input-field]').val().trim(),
                'vendor_price': vendor_price,
                'stock_on_hand': stock_on_hand,
                'active_status': $(this).find('input[name=item-active-state-switch]').prop('checked'),
            });
        });
        if (sent_datas.length < 1 || CHOSEN_VENDOR === undefined) return _ready_elem_for_changes(true);
        $.ajax({
            type: 'POST',
            url: 'https://prod-10.australiasoutheast.logic.azure.com:443/workflows/9c446ca7860c4c959ef3daeb9efb4afc/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=zbzH0dr5qI4AoKEwe6fRRAjF25ItC39wD5_SF4QiGNM',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({
                    'vendor_odata_id': CHOSEN_VENDOR.odataid,
                    'vendor_uid': CHOSEN_VENDOR.vendor_uid,
                    'new_mappings': sent_datas.filter(sent_data => sent_data.odata_id !== undefined),
                }),
            complete: function(response, status, xhr){
                _ready_elem_for_changes(true);
            },
            success: function(response, status, xhr){
                sent_datas.forEach(sent_data => {
                    PRODUCT_VENDOR_MAP_TABLE.find('tbody').find(`tr[data-productuid='${sent_data.product_uid}']`).remove();
                    UOM_PRODUCT_VENDOR_MAPS = UOM_PRODUCT_VENDOR_MAPS.filter(product => product.product_uid !== sent_data.product_uid);
                });
                alert('Successfully added ', sent_datas.length, ` new Product-Vendor${sent_datas.length > 1 ? 's' : ''}.\nTo edit them, please go to "Product-Vendor Info" page.`);
            },
            error: function(response, status, xhr){
                if (status === "timeout") return alert('Request timed out, please try again later');
                alert('Unable to add new Product-Vendor informations at this time');
            }
        });
    });
});