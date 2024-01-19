const AJAX_TIMEOUT_DURATION = 864000000;
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');
const VENDOR_SEARCH_TEXT_FIELD = $('input[name=vendor-search-input-field]');
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
let UOM_PRODUCT_UIDS = [];
let UOM_PRODUCT_VENDOR_MAPS = [];
const DISABLED_ELEM_CLASS = 'disabled-element';
const ERR_INPUT_INDICATOR_CLASS = 'red-outline';
const MAX_RECORD_NUM = 5000;

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

function make_product_vendor_map_row_markup(target_table, vendor_map_group, format_mapping, is_first=false){
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
                    data-vendorstockonhand='${format_mapping.vendor_stock_on_hand}'  data-vendorstockordered='${format_mapping.vendor_stock_ordered}' data-vendorstocktransit='${format_mapping.vendor_stock_transit}'
                    data-vendorprice='${format_mapping.vendor_price}' data-totalspent='${format_mapping.total_spent}' data-createdon='${format_mapping.createdon}'
                    data-isactive='${format_mapping.is_active ? 1 : 0}' data-laststockrefreshdate='${format_mapping.stock_refresh_date}' data-laststockrefreshdatestr='${format_mapping.stock_refresh_date_str}'
                    data-hasnext='${format_mapping.has_next}' data-pagenum='${format_mapping.curr_page_num}'
                    data-isfirstidx='${is_first ? 1 : 0}'
                    data-vendorstockremained='${format_mapping.vendor_stock_remained}'
                >
                ${is_first ? `
                <th scope="row" rowspan="${vendor_map_group.length}" class='span-grouped-row'>
                    ${make_load_more_product_vendor_map_btn_markup(vendor_map_group, format_mapping)}
                </th>
                <th scope="row" rowspan="${vendor_map_group.length}" class='span-grouped-row'>
                    ${format_mapping.vendor_name}<br>
                    <span class="material-symbols-rounded collapse-vendor-group-btn" data-vendoruid='${format_mapping.vendor_uid}' name='collapse-vendor-group-btn' data-expand='1' data-targetdata='data-vendoruid' data-rowspan='${vendor_map_group.length}'>expand_more</span>
                </th>
                ` : ''}
                <td>
                    <input maxlength='800' class='long-txt-edit-field border-effect' type='text' 
                        placeholder='${format_mapping.vendor_map_code}' name="vendor-map-code-input-field" value='${format_mapping.vendor_map_code}'/>
                </td>
                <td>${format_mapping.product_name}</td>
                <td>
                    <input maxlength='10000' class='product-quantity-input-field integer-input border-effect' type='text' 
                        placeholder='${format_mapping.vendor_stock_on_hand}' name="stock-on-hand-input-field" value='${format_mapping.vendor_stock_on_hand}'/>
                </td>
                <td>${format_mapping.vendor_stock_ordered}</td>
                <td name='stock-remained-txt-container'>${format_mapping.vendor_stock_remained_str}</td>
                <td>${format_mapping.vendor_stock_transit}</td>
                <td> 
                    <input maxlength='10' class='product-quantity-input-field integer-input border-effect' type='text' 
                        placeholder='${format_mapping.vendor_price}' name="vendor-price-input-field" value='${format_mapping.vendor_price.toFixed(2)}'/>
                </td>
                <td>$${format_mapping.total_spent}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input item-active-state-switch" type="checkbox" name='item-active-state-switch' ${format_mapping.is_active ? 'checked' : ''}>
                    </div>
                </td>
                <td>${format_mapping.category_name}</td>
                <td>${format_mapping.subcategory_name}</td>
                <td>${format_mapping.brand_name}</td>
                <td>${format_mapping.product_barcode}</td>
                <td>${format_mapping.product_size}</td>
                <td>${format_mapping.order_unit_name}</td>
                <td>${format_mapping.min_quantity}</td>
                <td>${format_mapping.bulk_order_unit_name}</td>
                <td>${format_mapping.stock_refresh_date_str}</td>
    </tr>
    `;
}

function render_product_vendor_map_table(target_table){
    UOM_PRODUCT_VENDOR_MAPS.sort((a, b) => `${a.vendor_name}-${a.product_name}`.localeCompare(`${b.vendor_name}-${b.product_name}`));
    group_arr_of_objs(UOM_PRODUCT_VENDOR_MAPS, 'vendor_uid').forEach(vendor_grouped_data => {
        vendor_grouped_data.grouped_objects.forEach((format_mapping, idx) => {
            target_table.find('tbody').append(make_product_vendor_map_row_markup(target_table, vendor_grouped_data.grouped_objects, format_mapping, idx === 0));
        });
    })
}


function format_product_vendor_map(json_mapping, vendor_info, has_next){
    return sanitise_json_obj({
        'product_uid': json_mapping['_prg_product_value'],
        'product_barcode': is_json_data_empty(json_mapping['product.prg_unitbarcodes']) ? '' : json_mapping['product.prg_unitbarcodes'],
        'product_name': json_mapping['_prg_product_value@OData.Community.Display.V1.FormattedValue'],
        'product_trimmed_name': clean_white_space(json_mapping['_prg_product_value@OData.Community.Display.V1.FormattedValue'].trim().toLowerCase()),
        'thumbnail_img': is_json_data_empty(json_mapping['product.prg_img_url']) ? PLACE_HOLDER_IMG_URL : json_mapping['product.prg_img_url'],
        'remark': json_mapping['product.prg_remarks'] ?? '',
        'min_quantity': json_mapping['product.prg_minorderquantity'],
        'order_unit_code': json_mapping['product.prg_orderunit'],
        'order_unit_name': json_mapping['product.prg_orderunit@OData.Community.Display.V1.FormattedValue'],
        'product_size': is_json_data_empty(json_mapping['product.prg_productsize']) ? '' : json_mapping['product.prg_productsize'],
        'unit_size': json_mapping['product.prg_unitsize'],
        'category_uid': json_mapping['product.prg_category'],
        'category_name': json_mapping['product.prg_category@OData.Community.Display.V1.FormattedValue'],
        'subcategory_uid': json_mapping['product.prg_subcategory'],
        'subcategory_name': json_mapping['product.prg_subcategory@OData.Community.Display.V1.FormattedValue'],
        'brand_code': is_json_data_empty(json_mapping['product.prg_brand']) ? -1 : json_mapping['product.prg_brand'],
        'brand_name': is_json_data_empty(json_mapping['product.prg_brand@OData.Community.Display.V1.FormattedValue']) ? 'No Brand' : json_mapping['product.prg_brand@OData.Community.Display.V1.FormattedValue'],
        'vendor_uid': json_mapping['_prg_vendor_value'],
        'vendor_name': json_mapping['_prg_vendor_value@OData.Community.Display.V1.FormattedValue'],
        'vendor_map_code': json_mapping.prg_code,
        'vendor_map_uid': json_mapping.prg_uomprocurementserviceproductvendormapid,
        'vendor_stock_on_hand': json_mapping.prg_stockonhand,
        'vendor_stock_ordered': json_mapping.prg_stockorderd,
        'vendor_stock_remained': json_mapping.prg_stockonhand - json_mapping.prg_stockorderd,
        'vendor_stock_remained_str': _format_vendor_stock_remained(json_mapping.prg_stockonhand, json_mapping.prg_stockorderd),
        'vendor_stock_transit': json_mapping.prg_stockintransit,
        'vendor_price': json_mapping.prg_price_base,
        'total_spent': parseFloat(json_mapping.prg_price_base * json_mapping.prg_stockorderd).toFixed(2),
        'createdon': json_mapping.createdon,
        'stock_refresh_date': is_json_data_empty(json_mapping.crcfc_stock_change_date) ? '' : json_mapping.crcfc_stock_change_date,
        'stock_refresh_date_str': is_json_data_empty(json_mapping.crcfc_stock_change_date) ? '_' : format_dt(new Date(json_mapping.crcfc_stock_change_date)),
        'bulk_order_unit_code': is_json_data_empty(json_mapping['product.prg_bulkorder']) ? 0 : json_mapping['product.prg_bulkorder'],
        'bulk_order_unit_name': is_json_data_empty(json_mapping['product.prg_bulkorder']) ? 'N/A' : json_mapping['product.prg_bulkorder@OData.Community.Display.V1.FormattedValue'],
        'is_active': json_mapping.statecode === 0,
        'has_next': has_next,
        'curr_page_num': vendor_info.curr_page_num,
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
        <div class='dropdown-item order-attr-filter-opt-container'>
            <input class='form-check-input filter-opt-radio' type='checkbox' name='${dropdown_container.attr('name')}-checkbox'
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

            render_filter_options(VENDOR_FILTER_DROPDOWN, vendor_filter_options);
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
    hide_elems_on_load();
    render_body_content();


    //Filter function
    $(document).on('keyup change', `${product_filter_checkbox_func_names}, input[name=sort-option-radio-checkbox], input[name=vendor-search-input-field]`, function(event){
        let no_filter = true;
        FILTER_DROPDOWNS.forEach(dropdown => {
            no_filter = no_filter && $(`input[name=${dropdown.attr('name')}-checkbox]:checked`).length < 1;
        });
        disable_button(CLEAR_FILTER_BTN, !$('input[name=product-search-input-field]').val() && $('input[name=sort-option-radio-checkbox]:checked').length < 1 && no_filter);
        //disable_button(CLEAR_FILTER_BTN, APPLY_FILTER_BTN.prop('disabled'));
    });

    function ready_loading_query(complete=false){
        render_loading_progress_bar(0);
        $('.resource-loader-section').toggle(!complete);
        $('div[name=spinner-resource-loader-container]').toggle(false);
        $('div[name=progress-resource-loader-container]').toggle(!complete);
        disable_filter_elements(!complete);
        $('.content-section.order-history-content-section').toggle(complete);
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN);

        if (!complete) {
            UOM_PRODUCT_VENDOR_MAPS = [];
            PRODUCT_VENDOR_MAP_TABLE.find('tbody').empty();
            VENDORS.forEach(vendor => {
                vendor.curr_page_num = 1;
                vendor.is_loading_more = false;
            });
        }
    }

    function process_filter_opts(){
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
        <filter type="and">
            <condition attribute="prg_name_trimmed" operator="like" value="%${clean_white_space(escape_xml_string(searched_products).trim().toLowerCase())}%" />
        </filter>`;
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

    APPLY_FILTER_BTN.on('click', function(event){
        let progress = 0;

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, true, BSTR_BORDER_SPINNER);

        const {
            filtered_vendors,
            filtered_category_xml_query,
            filtered_subcategory_xml_query,
            filtered_product_name_xml_query,
            filtered_brand_xml_query,
        } = process_filter_opts();

        ready_loading_query();

        function _complete_request(){
            if (progress < filtered_vendors.length - 1) return progress++;
            ready_loading_query(true);
            disable_button(CLEAR_FILTER_BTN, false);
            disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');
            render_product_vendor_map_table(PRODUCT_VENDOR_MAP_TABLE);
            disable_filter_elements(true, $('.order-attr-filter-opt-container'));
        }


        function retrieve_product_vendor_map(filtered_vendor){
            $.ajax({
                type: 'POST',
                url: 'https://prod-20.australiasoutheast.logic.azure.com:443/workflows/89b0941872fa40a2aabc91ebca4524c5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BLHeznQEMS8U3e6eYTo7U3bGwyzLJ7qhlOecfEFwjo4',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({'vendor_uid': filtered_vendor.vendor_uid, 
                                        'filtered_brand_xml_query': filtered_brand_xml_query, 
                                        'filtered_product_name_xml_query': filtered_product_name_xml_query, 
                                        'filtered_subcategory_xml_query': filtered_subcategory_xml_query, 
                                        'filtered_category_xml_query': filtered_category_xml_query,
                                        'page_num': filtered_vendor.curr_page_num,
                                        'num_items': MAX_RECORD_NUM}),
                complete: function(response, status, xhr){
                    _complete_request();
                    render_loading_progress_bar(100 * progress / filtered_vendors.length);
                },
                success: function(response, status, xhr){
                    if (progress >= filtered_vendors.length - 1) render_loading_progress_bar(100);
                    response.mappings.forEach(mapping => {
                        UOM_PRODUCT_VENDOR_MAPS.push(format_product_vendor_map(mapping, filtered_vendor, response.has_next));
                    });
                    filtered_vendor.curr_page_num = response.has_next ? filtered_vendor.curr_page_num + 1 : 0;
                }
            });
        }


        disable_filter_elements(true, $('.order-attr-filter-opt-container'));
        render_loading_progress_bar(0);
        filtered_vendors.forEach((filtered_vendor, i) => {
            (function(y) {
                setTimeout(function() {
                    retrieve_product_vendor_map(filtered_vendor);
                    }, y * 5);
                }(i));
        });
        
        /*disable_button(CLEAR_FILTER_BTN, false);
        disable_button(APPLY_FILTER_BTN, true, 'Apply Filters');*/
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        $('input[name=product-search-input-field]').val(null);
        $(document).find('.form-check-input').prop('checked', false);
        $(document).find('.form-check-input').attr('checked', false);

        ready_loading_query();
        $('div[name=progress-resource-loader-container]').toggle(false);
        disable_filter_elements(false);

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, false);
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

    $(document).on('click', 'span[name=load-more-product-vendor-map-btn]', function(event){
        const vendor_uid = $(this).attr('data-vendoruid');
        const corresponding_vendor = VENDORS.filter(vendor => vendor.vendor_uid === vendor_uid)[0];
        if (corresponding_vendor === undefined) return;

        const parent_table = $(this).closest('table');
        const parent_row = $(this).closest('tr');
        const parent_th = $(this).closest('th');

        const corresponding_mapping = UOM_PRODUCT_VENDOR_MAPS.filter(mapping => mapping.vendor_map_uid === parent_row.attr('data-vendormapuid'))[0];
        if (corresponding_mapping === undefined) return;

        corresponding_vendor.is_loading_more = true;

        const disabled_apply_changes = APPLY_PRODUCT_INFO_CHANGES_BTN.attr('disabled');
        const disabled_elements = $(`.long-txt-edit-field, .product-quantity-input-field, .form-check-input, div[name=mass-order-status-selection-opt-container], .collapse-vendor-group-btn`);
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true);
        disable_button(CLEAR_FILTER_BTN, true);
        disable_filter_elements(true, disabled_elements);
        parent_th.empty();
        parent_th.append(BSTR_BORDER_SPINNER);
        
        const collapse_btn = parent_row.find('span[name=collapse-vendor-group-btn]');
        const curr_expansion_status = collapse_btn.attr('data-expand') === '1';
        if (curr_expansion_status) expand_data_rows(collapse_btn, parent_table.attr('name'), 'data-vendoruid', vendor_uid, true);

        const {
            filtered_vendors,
            filtered_category_xml_query,
            filtered_subcategory_xml_query,
            filtered_product_name_xml_query,
            filtered_brand_xml_query,
        } = process_filter_opts();

        $.ajax({
            type: 'POST',
            url: 'https://prod-20.australiasoutheast.logic.azure.com:443/workflows/89b0941872fa40a2aabc91ebca4524c5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BLHeznQEMS8U3e6eYTo7U3bGwyzLJ7qhlOecfEFwjo4',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({'vendor_uid': corresponding_vendor.vendor_uid, 
                                    'filtered_brand_xml_query': filtered_brand_xml_query, 
                                    'filtered_product_name_xml_query': filtered_product_name_xml_query, 
                                    'filtered_subcategory_xml_query': filtered_subcategory_xml_query, 
                                    'filtered_category_xml_query': filtered_category_xml_query,
                                    'page_num': corresponding_vendor.curr_page_num,
                                    'num_items': MAX_RECORD_NUM}),
            complete: function(response, status, xhr){
                expand_data_rows(collapse_btn, parent_table.attr('name'), 'data-vendoruid', corresponding_vendor.vendor_uid, true);
                corresponding_vendor.is_loading_more = false;

                if(curr_expansion_status) expand_data_rows(collapse_btn, parent_table.attr('name'), 'data-vendoruid', corresponding_vendor.vendor_uid, false);
                if (VENDORS.filter(vendor => vendor.is_loading_more).length < 1){
                    if (!disabled_apply_changes) disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
                    disable_button(CLEAR_FILTER_BTN, false);
                    disable_filter_elements(false, disabled_elements);
                }
            },
            success: function(response, status, xhr){
                let new_mappings = [];
                const last_tr = parent_table.find(`tr[name=${parent_table.attr('name')}-row][data-vendoruid='${corresponding_vendor.vendor_uid}']:last`);
                response.mappings.forEach(mapping => {
                    const formatted_mapping = format_product_vendor_map(mapping, corresponding_vendor, response.has_next);
                    UOM_PRODUCT_VENDOR_MAPS.push(formatted_mapping);
                    new_mappings.push(formatted_mapping);
                });

                UOM_PRODUCT_VENDOR_MAPS.sort((a, b) => `${a.vendor_name}-${a.product_name}`.localeCompare(`${b.vendor_name}-${b.product_name}`));
                const new_product_vendor_group = UOM_PRODUCT_VENDOR_MAPS.filter(mapping => mapping.vendor_uid === corresponding_vendor.vendor_uid);

                new_mappings.sort((a, b) => `${a.vendor_name}-${a.product_name}`.localeCompare(`${b.vendor_name}-${b.product_name}`)).forEach(foramtted_mapping => {
                    last_tr.after(make_product_vendor_map_row_markup(parent_table, new_product_vendor_group, foramtted_mapping, false));
                });
                corresponding_vendor.curr_page_num = response.has_next ? corresponding_vendor.curr_page_num + 1 : 0;

                parent_th.empty();
                parent_row.find('th').each(function(){
                    $(this).attr('rowspan', new_product_vendor_group.length);
                });
                collapse_btn.attr('data-rowspan', new_product_vendor_group.length);
                corresponding_mapping.has_next = response.has_next;
                parent_th.append(make_load_more_product_vendor_map_btn_markup(new_product_vendor_group, corresponding_mapping));
            }
        });
    });


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
            const min =  is_int ? 0 : 0.00000001;
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
        const min =  is_int ? 0 : 0.00000001;
        const valid_input = verify_number_input($(this), is_int, min, max);
        if (valid_input && $(this).attr('name') === 'stock-on-hand-input-field') parent_tr.find('td[name=stock-remained-txt-container]').text(_format_vendor_stock_remained(parseInt($(this).val()), parseInt(parent_tr.attr('data-vendorstockordered'))));
        disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, false);
    });

    APPLY_PRODUCT_INFO_CHANGES_BTN.on('click', function(event){
        function _ready_elem_for_changes(disabled=true, complete=false){
            if (disabled){
                disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true, BSTR_BORDER_SPINNER);
            }else{
                let error_msg = 'Error Invalid Inputs detected for:';
                PRODUCT_VENDOR_MAP_TABLE.find('tbody').find('tr').each(function(){
                    const has_err = $(this).find(`.${ERR_INPUT_INDICATOR_CLASS}`).length > 0;
                    if (!has_err) return;
                    error_msg = `${error_msg}\n\t${$(this).attr('data-vendormapcode')} ${$(this).attr('data-productname')} from ${$(this).attr('data-vendorname')}`;
                });
                if (!complete) alert(error_msg);
                disable_button(APPLY_PRODUCT_INFO_CHANGES_BTN, true, 'Apply Changes');
            }
            disable_filter_elements(disabled, $(`.long-txt-edit-field, .product-quantity-input-field, .form-check-input, div[name=mass-order-status-selection-opt-container], .inner-load-more-data-row-btn`));
        }

        _ready_elem_for_changes();
        const is_valid = verify_valid_info_fields(PRODUCT_VENDOR_MAP_TABLE.attr('name'));
        if (!is_valid) return _ready_elem_for_changes(false);

        let sent_datas = [];
        PRODUCT_VENDOR_MAP_TABLE.find('tbody').find('tr').each(function(event){
            const corresponding_mapping = UOM_PRODUCT_VENDOR_MAPS.filter(mapping => mapping.vendor_map_uid === $(this).attr('data-vendormapuid'))[0];
            if (corresponding_mapping === undefined) return;

            const new_map_code = $(this).find('input[name=vendor-map-code-input-field]').val().trim();
            const new_price = parseFloat($(this).find('input[name=vendor-price-input-field]').val());
            const new_stock_onhand = parseInt($(this).find('input[name=stock-on-hand-input-field]').val());
            const new_active_status = $(this).find('input[name=item-active-state-switch]').prop('checked');

            if (new_map_code !== corresponding_mapping.vendor_map_code
                || new_price != corresponding_mapping.vendor_price
                || new_stock_onhand != corresponding_mapping.vendor_stock_on_hand
                || new_active_status != corresponding_mapping.is_active) {
                    sent_datas.push({
                        'map_uid': corresponding_mapping.vendor_map_uid,
                        'new_map_code': new_map_code.trim(),
                        'new_price': new_price,
                        'new_stock_onhand': new_stock_onhand,
                        'new_active_status': new_active_status,
                    })
                }
        });

        if (sent_datas.length < 1) return _ready_elem_for_changes(false, true);
        $.ajax({
            type: 'POST',
            url: 'https://prod-31.australiasoutheast.logic.azure.com:443/workflows/947d5a2faf0b4676b5e62c647b13a6b5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lB7qaOq_ty1wO6d4WHrPQmDGW3PwrDZjy80FtmOUvSU',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify(sent_datas),
            complete: function(response, status, xhr){
                _ready_elem_for_changes(false, true);
            },
            success: function(response, status, xhr){
                sent_datas.forEach(data => {
                    const corresponding_mapping = UOM_PRODUCT_VENDOR_MAPS.filter(mapping => mapping.vendor_map_uid === data.map_uid)[0];
                    if (corresponding_mapping === undefined) return;

                    corresponding_mapping.vendor_map_code = data.new_map_code;
                    corresponding_mapping.vendor_price = data.new_price;
                    corresponding_mapping.vendor_stock_on_hand = data.new_stock_onhand;
                    corresponding_mapping.vendor_stock_remained = data.new_stock_onhand - corresponding_mapping.vendor_stock_ordered;
                    corresponding_mapping.vendor_stock_remained_str = _format_vendor_stock_remained(data.new_stock_onhand, corresponding_mapping.vendor_stock_ordered);
                    corresponding_mapping.is_active = data.new_active_status;

                    const corresponding_tr = $(document).find(`tr[name=${PRODUCT_VENDOR_MAP_TABLE.attr('name')}-row][data-vendormapuid="${corresponding_mapping.vendor_map_uid}"]`).eq(0);
                    corresponding_tr.find('input[name=vendor-map-code-input-field]').attr('placeholder', data.new_map_code);
                    corresponding_tr.attr('data-vendormapcode', data.new_map_code);
                    corresponding_tr.find('input[name=vendor-price-input-field]').attr('placeholder', data.new_price);
                    corresponding_tr.attr('data-vendorprice', data.new_price);
                    corresponding_tr.find('input[name=stock-on-hand-input-field]').attr('placeholder', data.new_stock_onhand);
                    corresponding_tr.attr('data-vendorstockonhand',  data.new_stock_onhand);
                    corresponding_tr.attr('data-isactive', data.new_active_status ? 1 : 0);
                    corresponding_tr.attr('data-vendorstockremained', data.new_stock_onhand - corresponding_mapping.vendor_stock_ordered);
                });
                alert('Successfully applied changes');
            },
            error: function(response, status, xhr){
                if (status === 'timeout') return alert('Request timed out, please try again later or refresh the page');
                alert('Error applying changes');
            }
        });
    });
});