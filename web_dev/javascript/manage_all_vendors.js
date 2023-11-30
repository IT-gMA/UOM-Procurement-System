const AJAX_TIMEOUT_DURATION = 864000000;
const MAX_IMG_SIZE_KB = 80000;
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';

const APPLY_FILTER_BTN = $('button[name=apply-search-filter-btn]');
const CLEAR_FILTER_BTN = $('button[name=clear-search-filter-btn]');

const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');
const APPLY_CATEGORY_INFO_CHANGES_BTN = $('button[name=apply-order-info-changes-btn]');
const APPLY_INSERT_CATEGORY_BTN = $('button[name=apply-new-product-insertion-btn]');
const LOAD_MORE_PRODUCTS_BTN = $('button[name=load-more-orders-btn]');

const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PROGRESS_BAR_DOM = $('div[name=request-loader-progress-bar]');
const CATEGORY_INFO_TABLE = $('table[name=product-info-table]');
const INSERTED_CATEGORY_INFO_TABLE = $('table[name=inserted-product-info-table]');

const ACTIVE_STATUS_FILTER_DROPDOWN = $('ul[name=active-status-sort-opts]');
const CATEGORY_FILTER_DROPDOWN = $('ul[name=category-filter-opts]');
const SUBCATEGORY_FILTER_DROPDOWN = $('ul[name=sub-category-filter-opts]');
const BRAND_FILTER_DROPDOWN = $('ul[name=brand-filter-opts]');

let product_filter_checkbox_func_names = '';
const FILTER_DROPDOWNS = [CATEGORY_FILTER_DROPDOWN, SUBCATEGORY_FILTER_DROPDOWN, BRAND_FILTER_DROPDOWN,];
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
let INSERTED_UOM_CATEGORY = undefined;
const DISABLED_ELEM_CLASS = 'disabled-element';
const ERR_INPUT_INDICATOR_CLASS = 'red-outline';

const MAX_RECORD_NUM = 100;
let CURR_PAGE_NUM = 1;

//Product Image Upload Resources
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
    disable_button(APPLY_INSERT_CATEGORY_BTN, !INSERTED_CATEGORY_INFO_TABLE.find('input[name=category-name-input-field]').val() || is_whitespace(INSERTED_CATEGORY_INFO_TABLE.find('input[name=category-name-input-field]').val()));
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


function is_product_table_row_from_insertion(input_elem){
    return input_elem.closest('tr').closest('table').attr('name') === INSERTED_CATEGORY_INFO_TABLE.attr('name');
}
function render_category_card_preview(category, parent_container){
    parent_container.append(`<div class='card-container category-card' name='category-card-container'
        data-name='${category.category_name}'
        style='background-color: ${category.hex_colour}'>
        <div class='thumbnail-img-container'><img src='${category.thumbnail_img}'/></div><br><br>
        <div class='text-container'><div class='desc-txt_bx'>
                <div class='desc-txt_bx'>
                    <span style='font-weight: bold;'>${category.category_name}</span>
                </div>
            </div><span class="material-symbols-rounded">chevron_right</span></div><br></div>`);
}
//End of Util functions

function format_json_category(json_category, for_insert=false){
    return {
        'category_uid': for_insert ? 'new-brand-1' : json_category.prg_uomprocurementvendorid,
        'category_name': for_insert ? '' : json_category.prg_name,
        'trimmed_category_name': for_insert ? '' : clean_white_space(json_category.prg_name.trim().toLowerCase()),
        'createdon_str': for_insert ? format_dt(new Date()) : format_dt(new Date(json_category.createdon)),
        'createdon': for_insert ? `${new Date()}` : json_category.createdon,
        'modifiedon_str': for_insert ? format_dt(new Date()) : format_dt(new Date(json_category.modifiedon)),
        'modifiedon': for_insert ? `${new Date()}` : json_category.modifiedon,
        'is_active': for_insert ? true : json_category.statecode === 0,
    };
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
/*End of Util functions*/


function render_filter_options(dropdown_container, filter_opts, sort_by_label=false){
    if (sort_by_label) filter_opts = filter_opts.sort((a, b) => a.label.localeCompare(b.label));
    filter_opts.forEach(filter_opt => {
        dropdown_container.append(`
        <div class='dropdown-item  order-attr-filter-opt-container'>
            <input class='form-check-input filter-opt-radio product-row-attr-filter-chckbx' type='checkbox' name='${dropdown_container.attr('name')}-checkbox' data-label='${filter_opt.label}' data-value='${filter_opt.value}' data-parentul='${dropdown_container.attr('name')}'>
            <label class='form-check-label'>${filter_opt.label}</label>
        </div>
        `);
    });
}

function make_choice_selection_radio_dropdown(target_choices, default_choice_label, default_choice_value, affected_value, affected_label, container_name, item_uid, long_container=true){
    return `<div class='opt-selection-btn${long_container ? ' long-selection-btn' : ''}' id='sort-container' name='${container_name}' data-affectedvalue='${affected_value}' data-affectedlabel='${affected_label}'>
                <a class='nav-link' role='button' data-bs-toggle='dropdown' aria-expanded='false'>${default_choice_label}</a>
                    <ul class='dropdown-menu dropdown-menu-end' aria-labelledby='navbarDropdown' onclick='event.stopPropagation()' style='overflow: scroll; max-height: 20em;'>
                        ${target_choices.map((data, i) => `<div class='dropdown-item' name='${container_name}-checkbox-container'>
                                                                <input class='form-check-input filter-opt-radio attr-selection-opt-radio-checkbox' type='radio' data-value='${data.value}' data-label='${data.label}' name='${item_uid}-${container_name}-checkbox'${default_choice_value === data.value ? ' checked' : ''}>
                                                                <label class='form-check-label'>${data.label}</label>
                                                            </div> `).join('\n')}</ul></div>`;
}

function make_category_tr_markup(formatted_category, target_table){
    return `<tr name='${target_table.attr('name')}-row' class='data-row'
                data-categoryname='${formatted_category.category_name}' data-categoryuid='${formatted_category.category_uid}' data-trimmedcategoryname='${formatted_category.trimmed_category_name}'
                data-createdon='${formatted_category.createdon}' data-createdonstr='${formatted_category.createdon_str}'
                data-modifiedon='${formatted_category.modifiedon}' data-modifiedonstr='${formatted_category.modifiedon_str}'
                data-isactive='${formatted_category.is_active ? 1 : 0}'>
            >
            <td><input maxlength='800' class='long-txt-edit-field border-effect' type='text' placeholder='${formatted_category.category_name}' name="category-name-input-field" value='${formatted_category.category_name}'/></td>
            <td><div class="form-check form-switch"><input class="form-check-input item-active-state-switch" type="checkbox" name='category-active-state-switch' ${formatted_category.is_active ? 'checked' : ''}></div></td>
            <td>${formatted_category.createdon_str}</td>
            <td name='modifiedOnStrText'>${formatted_category.modifiedon_str}</td>
    </tr>`;
}

function render_inserted_category_table(){
    INSERTED_UOM_CATEGORY = format_json_category({}, true);
    INSERTED_CATEGORY_INFO_TABLE.find('tbody').empty();
    INSERTED_CATEGORY_INFO_TABLE.find('tbody').append(make_category_tr_markup(INSERTED_UOM_CATEGORY, INSERTED_CATEGORY_INFO_TABLE));
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
            
        }, success: function(response, status, xhr){
            response.vendors.forEach(category => {
                const formatted_category = format_json_category(category);
                CATEGORIES.push(formatted_category);
                CATEGORY_INFO_TABLE.find('tbody').append(make_category_tr_markup(formatted_category, CATEGORY_INFO_TABLE));
            });
            $('section[name=inserted-product-info-section]').toggle(true);
            render_inserted_category_table();
            $('.content-section.order-history-content-section').toggle(true);
            $('section[name=inserted-product-info-section]').toggle(true);
            render_filter_options(ACTIVE_STATUS_FILTER_DROPDOWN, [{'label': 'Active', 'value': 1}, {'label': 'Inactive', 'value': 0}]);

        }, error: function(response, status, xhr){
            alert('Failed to load data at this time');
        }
    });
}

function get_hex_value(hex_colour) {
    if (hex_colour.startsWith('#')) return hex_colour.substring(1);
    return hex_colour;
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
        parent_tr.find('input[name=category-name-input-field]').each(function(){
            if (!$(this).val() || is_whitespace($(this).val())) _invalidate_input($(this));
        });
        if (!is_valid) return false;
    });
    return is_valid;
}

function find_global_txt_duplicates(input_elem_markup, main_container=$(document), trimmed=true){
    let non_dupl_list = [];
    let dupl_list = [];
    main_container.find(input_elem_markup).each(function(){
        if (!$(this).val() || is_whitespace($(this).val())) return;
        const input_val = trimmed ? clean_white_space($(this).val().trim().toLowerCase()) : $(this).val();
        if (non_dupl_list.length < 1 || !non_dupl_list.includes(input_val)) return non_dupl_list.push(input_val);
        dupl_list.push($(this).val());
        $(this).addClass(ERR_INPUT_INDICATOR_CLASS);
    });
    return dupl_list;
}


$(document).ready(function(){
    hide_elems_on_load();
    render_body_content();

    $(document).on('click', '.applyBtn.btn.btn-sm.btn-primary', function(e){
        disable_button(APPLY_FILTER_BTN, false);
        disable_button(CLEAR_FILTER_BTN, false);
    });

    //Filter function
    $(document).on('keyup change', `${product_filter_checkbox_func_names}, input[name=sort-option-radio-checkbox], input[name=product-search-input-field], .search-text-field.filter-search-text-field, input[name=xml-sort-option-radio-checkbox], .product-row-attr-filter-chckbx`, function(event){
        let no_filter = true;
        disable_button(APPLY_FILTER_BTN, !$('input[name=product-search-input-field]').val() && $('input[name=xml-sort-option-radio-checkbox]:checked').length < 1 && no_filter);
        disable_button(CLEAR_FILTER_BTN, !$('input[name=product-search-input-field]').val() && $('input[name=xml-sort-option-radio-checkbox]:checked').length < 1 && no_filter);
    });

    function apply_sort(data_row, sort_radio_dom){
        const sort_attr = sort_radio_dom.attr('data-attrname');
        const is_desc = sort_radio_dom.attr('data-isdesc') === '1';
        if (sort_attr === 'data-productname'){
            data_row.sort(function(a, b){
                return $(!is_desc ? a : b).find('input[name=category-name-input-field]').val().localeCompare( $(!is_desc ? b : a).find('input[name=category-name-input-field]').val())
            }).appendTo(data_row.closest('tbody'));
        }else if (['data-createdon', 'data-modifiedon'].includes(sort_attr)){
            data_row.sort(function(a, b){
                return new Date($(!is_desc ? a : b).attr(sort_attr)) - new Date($(!is_desc ? b : a).attr(sort_attr))
            }).appendTo(data_row.closest('tbody'));
        }
    }

    function process_local_filter_opts(){
        function _get_filter_object(filter_dropdown){
            return {'attr': filter_dropdown.attr('data-filterattr'), 'filter_opts': get_selected_filter_values((`${filter_dropdown.attr('name')}-checkbox`))};
        }
        return {
            active_status_filter_obj: _get_filter_object(ACTIVE_STATUS_FILTER_DROPDOWN),
        };
    }

    APPLY_FILTER_BTN.on('click', function(event){
        disable_button($(this), true, BSTR_BORDER_SPINNER);
        const {active_status_filter_obj} = process_local_filter_opts();
        const searched_category = !$('input[name=product-search-input-field]').val() ? '' : clean_white_space($('input[name=product-search-input-field]').val().trim().toLowerCase());
        CATEGORY_INFO_TABLE.find(`tr[name=${CATEGORY_INFO_TABLE.attr('name')}-row]`).each(function(){
            $(this).toggle(clean_white_space($(this).find('input[name=category-name-input-field]').val().trim().toLowerCase()).includes(searched_category)
                            && active_status_filter_obj.filter_opts.includes($(this).attr(active_status_filter_obj.attr))
                            );

        });
        apply_sort($(`tr[name=${CATEGORY_INFO_TABLE.attr('name')}-row]`), $('input[name=xml-sort-option-radio-checkbox][type="radio"]:checked'));
        disable_button(CLEAR_FILTER_BTN, false);
        disable_button($(this), true, 'Apply Filter');
    });


    CLEAR_FILTER_BTN.on('click', function(event){
        $('input[name=product-search-input-field]').val(null);
        CATEGORY_INFO_TABLE.find('tbody').find('tr').each(function(){$(this).toggle(true);});
        apply_sort($(`tr[name=${CATEGORY_INFO_TABLE.attr('name')}-row]`), $('input[name=xml-sort-option-radio-checkbox][data-attrname="data-productname"][data-isdesc="0"'));

        $(document).find('.form-check-input.filter-opt-radio.order-attr-filter-opt-container').prop('checked', false);
        $(document).find('.form-check-input.filter-opt-radio.order-attr-filter-opt-container').attr('checked', false);

        $('.content-section.search-and-filter-section').find('.product-row-attr-filter-chckbx').each(function(){
            $(this).prop('checked', false);
        });
        $('ul[name=xml-product-sort-opts]').find('input[type="radio"]').prop('checked', false);
        $('input[name=xml-sort-option-radio-checkbox][data-attrname="data-productname"][data-isdesc="0"').prop('checked', true);

        disable_button(CLEAR_FILTER_BTN, true);
        disable_button(APPLY_FILTER_BTN, true);
    });

    // Modal functions
    $(document).on('click', '.close-modal-btn', function(event){
        if (IS_UPDATING_IMG) return;
        $(this).closest('.modal').modal('hide');
    });
    //Category Info Button function


    // Product Info Input Change Functions
    $(document).on('change keyup', '.attr-selection-opt-radio-checkbox', function(event){
        const parent_tr = $(this).closest('tr');
        const main_container = $(this).closest('#sort-container');
        
        const _label = $(this).closest('div').find('.form-check-label').text();
        const _value = $(this).attr('data-value');
        main_container.find('.nav-link').text(_label);
        parent_tr.attr(`${main_container.attr('data-affectedvalue')}`, _value);
        parent_tr.attr(`${main_container.attr('data-affectedlabel')}`, _label);
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_CATEGORY_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', 'input[name=category-active-state-switch]', function(event){
        $(this).closest('tr').attr('data-isactive', $(this).prop('checked') ? 1 : 0);
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_CATEGORY_INFO_CHANGES_BTN, false);
    });

    $(document).on('change keyup', 'input[name=category-name-input-field]', function(event){
        remove_input_red_color($(this));
        is_product_table_row_from_insertion($(this)) ? disable_insert_new_product_btn() : disable_button(APPLY_CATEGORY_INFO_CHANGES_BTN, false);
    });

    // Reset Empty Input Values
    $(document).on('blur', '.product-quantity-input-field, input[name=category-name-input-field]', function(event){
        const parent_tr = $(this).closest('tr');
        const is_inserted_product = is_product_table_row_from_insertion($(this));
        const formatted_category = is_inserted_product ? INSERTED_UOM_CATEGORY : CATEGORIES.filter(category => category.category_uid === parent_tr.attr('data-categoryuid'))[0];
        if (formatted_category === undefined) return;
        if (!$(this).val() || is_whitespace($(this).val())){
            if ($(this).attr('name') === 'category-name-input-field' && !is_inserted_product) {
                $(this).val(formatted_category.category_name);
            }
        }
    });

    // Apply Product Update function
    APPLY_CATEGORY_INFO_CHANGES_BTN.on('click', function(event){
        function _ready_elem_for_changes(disabled=true, complete=false){
            if (disabled){
                disable_button(APPLY_CATEGORY_INFO_CHANGES_BTN, true, BSTR_BORDER_SPINNER);
            }else{
                let error_msg = 'Error Invalid Inputs detected for:';
                CATEGORY_INFO_TABLE.find('tbody').find('tr').each(function(){
                    const has_err = $(this).find(`.${ERR_INPUT_INDICATOR_CLASS}`).length > 0;
                    if (!has_err) return;
                    error_msg = `${error_msg}\n\t${$(this).attr('data-categoryname')}`;
                });
                if (!complete) alert(error_msg);
                disable_button(APPLY_CATEGORY_INFO_CHANGES_BTN, true, 'Apply Changes');
            }
            disable_filter_elements(!complete, APPLY_CATEGORY_INFO_CHANGES_BTN.closest('section').find('.product-quantity-input-field, .item-active-state-switch, .long-txt-edit-field, div[name=category-info-btn], .opt-selection-btn, .color-picker-input-field, td[name=category-card-preview-btn]'));
            disable_button(CLEAR_FILTER_BTN, !complete);
        }
        _ready_elem_for_changes();
        const is_valid = verify_valid_info_fields(CATEGORY_INFO_TABLE.attr('name'));
        if (!is_valid) return _ready_elem_for_changes(false, true);
        const duplicating_names = find_global_txt_duplicates('input[name=category-name-input-field]', CATEGORY_INFO_TABLE, true);
        if (duplicating_names.length > 0) {
            alert(`Duplicating Vendor names found at:\n${duplicating_names.sort().map(dupl_name => `\t${dupl_name}`)}`);
            return _ready_elem_for_changes(false, true);
        }
        let _updated_categories = [];
        CATEGORY_INFO_TABLE.find('tbody').find(`tr[name=${CATEGORY_INFO_TABLE.attr('name')}-row]`).each(function(){
            const formatted_category = CATEGORIES.filter(category => category.category_uid === $(this).attr('data-categoryuid'))[0];
            if (formatted_category === undefined) return;
            const updated_data = {'vendor_uid': formatted_category.category_uid,
                                    'new_vendor_name': $(this).find('input[name=category-name-input-field]').val(),
                                    'new_active_status': $(this).find('input[name=category-active-state-switch]').prop('checked'),
                                };
            if (updated_data.new_vendor_name === formatted_category.category_name && updated_data.new_active_status === formatted_category.is_active) return;
            _updated_categories.push(updated_data);
        });
        if (_updated_categories.length < 1) return _ready_elem_for_changes(false, true);
        $.ajax({
            type: 'POST',
            url: 'https://prod-18.australiasoutheast.logic.azure.com:443/workflows/8cbc1bdc66ec49ae920c880f04e137a5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Dek1lYTnJWYT1R0Kbdj6nzT_1N346V_phv6nsuAGXaA',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify(_updated_categories),
            complete: function(response, status, xhr){
                _ready_elem_for_changes(false, true);
            },success: function(response, status, xhr){
                _updated_categories.forEach(updated_category => {
                    const formatted_category = CATEGORIES.filter(category => category.category_uid === updated_category.vendor_uid)[0];
                    const corresponding_tr = CATEGORY_INFO_TABLE.find('tbody').find(`tr[name=${CATEGORY_INFO_TABLE.attr('name')}-row][data-categoryuid='${updated_category.vendor_uid}']`);
                    if (formatted_category === undefined || corresponding_tr.length < 1) return;
                    
                    formatted_category.category_name = updated_category.new_vendor_name;
                    formatted_category.trimmed_category_name = clean_white_space(updated_category.new_vendor_name.trim().toLowerCase());
                    formatted_category.is_active = updated_category.new_active_status;
                    formatted_category.modifiedon = new Date();
                    formatted_category.modifiedon_str = format_dt(new Date());

                    corresponding_tr.attr('data-categoryname', formatted_category.category_name);
                    corresponding_tr.attr('data-trimmedcategoryname', formatted_category.trimmed_category_name);
                    corresponding_tr.attr('data-modifiedon', formatted_category.modifiedon);
                    corresponding_tr.attr('data-modifiedonstr', formatted_category.modifiedon_str);
                    corresponding_tr.find('td[name=modifiedOnStrText]').text(formatted_category.modifiedon_str);
                });
                alert(`Successfully updated ${_updated_categories.length} vendor${_updated_categories.length > 1 ? 's' : ''}.`);
            },
            error: function(response, status, xhr){
                if (status === 'timeout') return alert('Request timed out');
                alert('Failed to apply updates');
            }});
    });

    // Apply Product Insertion Function
    APPLY_INSERT_CATEGORY_BTN.on('click', function(event){
        function _ready_elem_for_changes(disabled=true, complete=false){
            if (disabled){
                disable_button(APPLY_INSERT_CATEGORY_BTN, true, BSTR_BORDER_SPINNER);
            }else{
                let error_msg = 'Error Invalid Inputs detected for:';
                INSERTED_CATEGORY_INFO_TABLE.find('tbody').find('tr').each(function(){
                    const has_err = $(this).find(`.${ERR_INPUT_INDICATOR_CLASS}`).length > 0;
                    if (!has_err) return;
                    error_msg = `${error_msg}\n\t${$(this).attr('data-categoryname')}`;
                });
                if (!complete) alert(error_msg);
                disable_button(APPLY_INSERT_CATEGORY_BTN, true, 'Apply Changes');
            }
            disable_filter_elements(!complete, APPLY_INSERT_CATEGORY_BTN.closest('section').find('.product-quantity-input-field, .item-active-state-switch, .long-txt-edit-field, div[name=category-info-btn], .opt-selection-btn, .color-picker-input-field, td[name=category-card-preview-btn]'));
            disable_button(CLEAR_FILTER_BTN, !complete);
        }
        _ready_elem_for_changes();
        const is_valid = verify_valid_info_fields(INSERTED_CATEGORY_INFO_TABLE.attr('name'));
        if (!is_valid) return _ready_elem_for_changes(false, true);
        const duplicating_names = find_global_txt_duplicates('input[name=category-name-input-field]', $(document), true);
        if (duplicating_names.length > 0) {
            alert(`Duplicating Brand names found at:\n${duplicating_names.sort().map(dupl_name => `\t${dupl_name}`)}`);
            return _ready_elem_for_changes(false, true);
        }
        let new_category = undefined;
        INSERTED_CATEGORY_INFO_TABLE.find('tbody').find(`tr[name=${INSERTED_CATEGORY_INFO_TABLE.attr('name')}-row]`).each(function(){
            new_category = {
                'vendor_name': $(this).find('input[name=category-name-input-field]').val(),
                'active_status': $(this).find('input[name=category-active-state-switch]').prop('checked'),
            };
        });
        if (new_category === undefined) return _ready_elem_for_changes(false, true);
        $.ajax({
            type: 'POST',
            url: 'https://prod-08.australiasoutheast.logic.azure.com:443/workflows/72ffcd8ca5994ff3beb26bf547453f74/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Mp3slbqLDce1GcrbxTf9UfXRNIl1S-NaZGzspCjD3g4',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify(new_category),
            complete: function(response, status, xhr){
                _ready_elem_for_changes(false, true);
            },success: function(response, status, xhr){
                const formatted_category = format_json_category(response.new_vendor);
                CATEGORIES.push(formatted_category);
                CATEGORY_INFO_TABLE.find('tbody').prepend(make_category_tr_markup(formatted_category, CATEGORY_INFO_TABLE))
                render_inserted_category_table();
                alert('Successfully added new vendor');
            },
            error: function(response, status, xhr){
                if (status === 'timeout') return alert('Request timed out');
                alert('Failed to add new vendor at this time');
            }});
    });
});