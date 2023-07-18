const AJAX_TIMEOUT_DURATION = 864000000;
const PLACE_HOLDER_IMG_URL = 'https://i.ibb.co/VMPPhzc/place-holder-catering-item-img.webp';
const APPLY_SEARCH_BTN = $('button[name=apply-search-filter-btn]');
const PRODUCT_SEARCH_TEXT_FIELD = $('input[name=product-search-input-field]');
const BSTR_BORDER_SPINNER = `<div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>`;
const PRODUCT_CONTAINER_MODAL = $('div[name=product-container-modal]');
const CART_CONTAINER_MODAL = $('div[name=cart-item-container-modal]');
let IS_MAKING_ORDER = false;
let IS_UPDATING_CART = false;
const CART_BUTTON = $('div[name=shopping-cart-button]');

const UPDATE_CART_BTN = $('button[name=update-cart-btn]');
const CLEAR_CART_BTN = $('button[name=clear-cart-btn]');
const CHECKOUT_CART_BTN = $('button[name=go-to-checkout-btn]');

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
    return `${window.location.origin}view-products?category-uid=${category_uid}`;
}

function is_json_data_empty(data){
    if ([null, undefined].includes(data)) return true;
    if (typeof data == 'string') return is_whitespace(data);
    return false;
}

function hide_elems_on_load(complete=false){
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


function _format_new_elem_vert_position(pos){
    const _pos_in_vh = pos * 100 / screen_height;
    return pos < 1.5 ? '1.5vh' : _pos_in_vh > 95 ? '95vh' : `${_pos_in_vh}vh`;
}

function _format_new_elem_hrz_position(pos){
    const _pos_in_vw = pos * 100 / screen_width;
    return _pos_in_vw < 1.5 ? '1.5vw' : _pos_in_vw > 92.5 ? '92.5vw' : `${_pos_in_vw}vw`;
}

let screen_width = window.innerWidth;
let screen_height = window.innerHeight;
window.addEventListener('resize', function() {
    screen_width = window.innerWidth;
    screen_height = window.innerHeight;
  });

function _drag_element(elem){
    let initial_hrz_pos = 0, initial_vert_pos = 0, curr_hrz_pos = 0, curr_vert_pos = 0;
    elem.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        curr_hrz_pos = e.clientX;
        curr_vert_pos = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }
    
      function elementDrag(e) {
        CART_BUTTON.css('transition', 'none');
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        initial_hrz_pos = curr_hrz_pos - e.clientX;
        initial_vert_pos = curr_vert_pos - e.clientY;
        curr_hrz_pos = e.clientX;
        curr_vert_pos = e.clientY;
        // set the element's new position:
        //elem.style.bottom = _format_new_elem_vert_position(elem.offsetTop - initial_vert_pos);
        //elem.style.left = _format_new_elem_hrz_position(elem.offsetLeft - initial_hrz_pos);
        //elem.style.left = `${curr_hrz_pos * 100 / screen_width}vw`;
        console.log(curr_hrz_pos);
        elem.style.left = _format_new_elem_hrz_position(curr_hrz_pos);
        //elem.style.bottom = _format_new_elem_hrz_position(curr_vert_pos);
      }
    
      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }
}
/*End of Util functions*/


function render_category_card(category_json_data){
    const _img_url = is_json_data_empty(category_json_data.prg_img_url) ? PLACE_HOLDER_IMG_URL : category_json_data.prg_img_url;
    const _hex_colour = is_json_data_empty(category_json_data.prg_hexcolour) ? '#e6e6e4' : `#${category_json_data.prg_hexcolour.replace('#', '')}`;
    //category-card-uid-${category_json_data.prg_uomprocurementservicecategoriesid}
    let category_card_markup = `<div class='card-container category-card' name='category-card-container'
                                        data-uid='${category_json_data.prg_uomprocurementservicecategoriesid}'
                                        data-name='${category_json_data.prg_name}'
                                        style='background-color: ${_hex_colour}'>
                                    <div class='thumbnail-img-container'>
                                        <img src='${_img_url}'/>
                                    </div>
                                    <br><br>
                                    <div class='text-container'>
                                        <div class='desc-txt_bx'>
                                            <div class='desc-txt_bx'>
                                                <span style='font-weight: bold;'>${category_json_data.prg_name}</span>
                                            </div>
                                        </div>
                                        <span class="material-symbols-rounded">chevron_right</span>
                                    </div>
                                    <br>
                                </div>`
    $('.grid-body-content-section').append(category_card_markup);
}


function _get_text_padding(max_length, curr_txt, html_tag='span'){
    return '';
    let padding_length = max_length - curr_txt.length;
    if (padding_length < 1) padding_length = 1;
    return `<${html_tag} id='text-padding'>${'#'.repeat(max_length - curr_txt.length)}</${html_tag}>`;
}


function render_product_cards(products, parent_container, show_category=false){
    console.log(products);
    const longest_category_name = products.sort((a, b) => b.category_name.length - a.category_name.length)[0]['category_name'].length;
    const longest_subcategory_name = products.sort((a, b) => b.subcategory_name.length - a.subcategory_name.length)[0]['subcategory_name'].length;
    let sort_product_by_name = products.length > 0;
    if (products[0].is_cart_item) sort_product_by_name = false;
    if (sort_product_by_name) products.sort((a, b) => a.name.localeCompare(b.name));
    products.forEach(product => {
        let product_update_btn = `<button type='button' class='btn btn-primary add-to-cart-btn' name='add-to-cart-btn' ${product.max_quantity <= 0 ? 'disabled' : ''}>${product.max_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</button>`;
        if (product.is_cart_item) product_update_btn = `<button type='button' class='btn btn-primary add-to-cart-btn' name='remove-cart-item-btn' id="clear-cart-btn" style='background-color: #F57F25;' data-btnlabel='Remove Item'>Remove Item</button>`;
        parent_container.append(`<div class='card-container product-card' name='product-card-container'
                                                                data-productuid='${product.uid}' data-fromcart='${product.is_cart_item ? '1' : '0'}'
                                                                data-name='${product.name}' data-nametrimmed='${product.trimmed_name}'
                                                                data-vendormapocode='${product.vendor_map_code}' data-vendormapuid='${product.vendor_map_uid}'
                                                                data-barcode='${product.product_barcode}'
                                                                data-brand='${product.brand_name}' data-brandcode='${product.brand_code}'
                                                                data-orderunitname='${product.order_unit_name}' data-orderunitcode='${product.order_unit_code}'
                                                                data-unitsize='${product.unit_size}' data-productsize='${product.product_size}'
                                                                data-categoryname='${product.category_name}' data-categoryuid='${product.category_uid}'
                                                                data-subcategoryname='${product.subcategory_name}' data-subcategoryuid='${product.subcategory_uid}'
                                                                data-vendorname='${product.vendor_name}' data-vendoruid='${product.vendor_uid}' 
                                                                data-minquantity='${product.min_quantity}' data-maxquantity='${product.max_quantity}'
                                                                data-vendorstockonhand='${product.vendor_stock_on_hand}' data-vendorstockordered='${product.vendor_stock_ordered}'
                                                                data-vendorprice='${product.price}'
                                                                data-numincart='${product.num_in_cart}' data-totalprice='${product.total_price}' data-cartuid='${product.cart_uid}'
                                                                data-createdon='${product.createdon}'>
                                                                <p id='product-remark-container' hidden>${product.remark}</p>
                                                                <div class='thumbnail-img-container'>
                                                                    <img src='${product.thumbnail_img}'/>
                                                                </div>
                                                                <div class='product-description-container'>
                                                                    <div class='text-container'>
                                                                        <div class='desc-txt_bx'>
                                                                            <span style='font-weight: bold;'>${product.name}</span>
                                                                        </div>
                                                                        <span class="material-symbols-rounded product-info-btn" name='product-info-btn'>info</span>
                                                                    </div>
                                                                    <div style='min-height: 4em;' ${product.is_cart_item ? 'hidden' : ''}>
                                                                        <hr>
                                                                        <h6>
                                                                            ${!show_category ? '' : `<span style='font-weight: 600;'>${product.category_name}${_get_text_padding(longest_category_name, product.category_name)}</span><br>`}
                                                                            <span style='font-weight: 500; opacity: ${product.subcategory_uid === 'f0d85952-7c19-ee11-8f6c-000d3a6ac9e1' ? '0' : '1'}'>${product.subcategory_name}${_get_text_padding(longest_subcategory_name, product.subcategory_name)}</span><br>
                                                                        </h6>
                                                                    </div>
                                                                    <p>
                                                                        $${product.price.toFixed(2)}
                                                                        ${product.is_cart_item ? '<!--' : '<br>'}${is_whitespace(product.product_size) ? '' : `${product.product_size} - `}${product.unit_size} - ${product.order_unit_name}${product.is_cart_item ? '-->' : ''}
                                                                    </p>
                                                                </div>
                                                                <div class='quantity-control-container'>
                                                                    <i class="fa-solid fa-circle-plus product-quantity-control-btn" name='product-quantity-control-btn' data-add='1'></i>
                                                                    <input class='product-quantity-input-field integer-input border-effect' type='text' placeholder='${product.min_quantity}' data-maxquantity='${product.max_quantity}' name="product-quantity-input-field" data-minquantity='${product.min_quantity}' ${product.max_quantity <= 0 ? 'disabled' : ''}
                                                                            ${product.is_cart_item ?  `value='${product.num_in_cart}'` : ''}/>
                                                                    <i class="fa-solid fa-circle-minus product-quantity-control-btn" name='product-quantity-control-btn' data-add='0'></i>
                                                                </div>
                                                                <div style='display: flex; align-items: center; justify-content: center; position: relative; width: 100%; margin-top: 1.25em;'>
                                                                    ${product_update_btn}
                                                                </div>
        </div>`);
    });
}


function render_body_content(){
    $.ajax({
        type: 'POST',
        url: 'https://prod-26.australiasoutheast.logic.azure.com:443/workflows/3dc091c8db904dd0b1a0ce905a2c727c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=JriRMMLFOymepwZQCU-oreQsQFnur7a4AD2cOqcLmhc',
        contentType: 'application/json',
        accept: 'application/json;odata=verbose',
        timeout: AJAX_TIMEOUT_DURATION,
        complete: function(response, status, xhr){
            if (String(status) !== 'success'){
                alert('Unable to load data at this time');
                return hide_elems_on_load(true);
            }
            category_json_datas = response['responseJSON'];
            $.ajax({
                type: 'POST',
                url: 'https://prod-15.australiasoutheast.logic.azure.com:443/workflows/3e23899232174009b8be511c7a43412d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=G4Ydf5oYEVZlgQTb4JjS1UFpdaVccR8zXWrIGRtE2cs',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify({"customer_uid": "e391c7cb-e9c7-ed11-b597-00224897d329", 'query_num_items_only': true}),
                complete: function(response, status, xhr){
                    if (String(status) !== 'success'){
                        alert('Unable to load data at this time');
                        return hide_elems_on_load(true);
                    }
                    category_json_datas.forEach(category_json_data => {
                        render_category_card(category_json_data);
                    });
                    const num_ordered = response['responseJSON']['num_items_orderd'];
                    CART_BUTTON.attr('data-quantity', num_ordered);
                    CART_BUTTON.find('[name=cart-item-num]').eq(0).text(num_ordered);
                    hide_elems_on_load(true);
                }
            });
        }
    });
}


function process_product_vendor_map(products, vendor_product_maps, cart_items=undefined){
    let formatted_products = [];
    products.forEach(product => {
        let formatted_product = {
            'uid': product.prg_uomprocurementserviceproductsid,
            'product_barcode': is_json_data_empty(product.prg_unitbarcodes) ? '' : product.prg_unitbarcodes,
            'name': product.prg_name,
            'trimmed_name': clean_white_space(product.prg_name.trim().toLowerCase()),
            'thumbnail_img': is_json_data_empty(product.prg_img_url) ? PLACE_HOLDER_IMG_URL : product.prg_img_url,
            'remark': product.prg_remarks ?? '',
            'min_quantity': product.prg_minorderquantity,
            'order_unit_code': product.prg_orderunit,
            'order_unit_name': product['prg_orderunit@OData.Community.Display.V1.FormattedValue'],
            'product_size': is_json_data_empty(product.prg_productsize) ? '' : product.prg_productsize,
            'unit_size': product.prg_unitsize,
            'category_uid': product['_prg_category_value'],
            'category_name': product['_prg_category_value@OData.Community.Display.V1.FormattedValue'],
            'subcategory_uid': product['_prg_subcategory_value'],
            'subcategory_name': product['_prg_subcategory_value@OData.Community.Display.V1.FormattedValue'],
            'brand_code': is_json_data_empty(product.prg_brand) ? -1 : product.prg_brand,
            'brand_name': is_json_data_empty(product['prg_brand@OData.Community.Display.V1.FormattedValue']) ? 'No Brand' : product['prg_brand@OData.Community.Display.V1.FormattedValue'],
            'vendor_uid': undefined,
            'vendor_name': undefined,
            'createdon': product.createdon,
            'product_stock_on_hand': product.prg_sumstockonhand,
            'product_stock_ordered': product.prg_sumstockordered,
            'bulk_order_unit_code': is_json_data_empty(product.prg_bulkorder) ? 0 : product.prg_bulkorder,
            'bulk_order_unit_name': is_json_data_empty(product.prg_bulkorder) ? 'N/A' : product['prg_bulkorder@OData.Community.Display.V1.FormattedValue'],
            //For cart items
            'is_cart_item': cart_items !== undefined,
            'cart_uid': undefined,
            'num_in_cart': -1,
            'total_price': -1,
        }
        const vendor_product_map = vendor_product_maps.filter(vendor_product_map => vendor_product_map['_prg_product_value'] === formatted_product.uid)[0];
        if (vendor_product_map === undefined) return;

        formatted_product['vendor_uid'] = vendor_product_map['_prg_vendor_value'];
        formatted_product['vendor_name'] = vendor_product_map['_prg_vendor_value@OData.Community.Display.V1.FormattedValue'];
        formatted_product['vendor_map_code'] = vendor_product_map.prg_code;
        formatted_product['vendor_map_uid'] = vendor_product_map.prg_uomprocurementserviceproductvendormapid;
        formatted_product['price'] = vendor_product_map.prg_price_base;
        formatted_product['vendor_stock_on_hand'] = vendor_product_map.prg_stockonhand;
        formatted_product['vendor_stock_ordered'] = vendor_product_map.prg_stockorderd;
        formatted_product['max_quantity'] = parseInt(Math.floor((vendor_product_map.prg_stockonhand - vendor_product_map.prg_stockorderd) / formatted_product.min_quantity));
        if (formatted_product['max_quantity'] < 0) formatted_product['max_quantity'] = 0;

        if (formatted_product.is_cart_item){
            const cart_item = cart_items.filter(cart_item => cart_item['_prg_product_value'] === formatted_product.uid)[0];
            if (cart_item === undefined) return;
            formatted_product['cart_uid'] = cart_item.prg_uomprocurementorderid,
            formatted_product['num_in_cart'] = cart_item.prg_stockordered;
            formatted_product['total_price'] = cart_item.prg_stockordered * formatted_product['price'];
            formatted_product['max_quantity'] = formatted_product['max_quantity'] + formatted_product['num_in_cart'];
        }
        formatted_products.push(formatted_product);

    });
    return formatted_products.filter(formatted_product => formatted_product.vendor_uid != undefined);
}


function get_product_info_markup(info_name, info_content, is_last=false){
    return `<h6><span style='font-weight: bold;'>${info_name}: </span>${info_content}</h6>${is_last ? '' : '<br>'}`;
}


function process_product_out_of_quantity(valid, product_card){
    const cart_btn = product_card.find('[name=add-to-cart-btn]').eq(0);
    const input_field = product_card.find('.product-quantity-input-field').eq(0);
    disable_button(cart_btn, true, 'Out of Stock');
    input_field.attr('disabled', true);
    if (!valid) alert(`${product_card.attr('data-name')} is currently out of stock`);
}


$(document).ready(function(){
    _drag_element(document.getElementById('cart-btn-container'));
    hide_elems_on_load();
    render_body_content();

    // Modal functions
    $(document).on('click', '.close-modal-btn', function(event){
        if ($(this).closest('.modal').attr('name') === PRODUCT_CONTAINER_MODAL.attr('name')) return $('.modal').modal('hide');
        $(this).closest('.modal').modal('hide');
    });

    $(document).on('click', 'div[name=category-card-container]', function(){
        const category_uid = $(this).attr('data-uid');
        console.log(category_uid);
        get_category_relative_path(category_uid);
        //return window.location = get_category_relative_path(category_uid);
    });


    //Product quantity function
    $(document).on('change keyup', 'input[name=product-quantity-input-field]', function(event){
        const parent_card = $(this).closest('.product-card');
        const cart_btn = parent_card.find('[name=add-to-cart-btn]').eq(0);
        const max_quantity = parseInt($(this).attr('data-maxquantity'));
        if (max_quantity <= 0 || cart_btn.prop('disabled') && parent_card.attr('data-fromcart') != '1') return disable_button(cart_btn, true, 'Out of Stock');
        const valid_input = verify_integer_input($(this), $(this).attr('placeholder'), parseInt($(this).attr('data-minquantity')), parseInt($(this).attr('data-maxquantity')));
        //disable_button(cart_btn, fal, valid_input ? 'Add to Cart' : 'Invalid Quantity');
    });

    $(document).on('click', 'i[name=product-quantity-control-btn]', function(event){
        const parent_card = $(this).closest('.product-card');
        const cart_btn = parent_card.find('[name=add-to-cart-btn]').eq(0);
        const _is_add = $(this).attr('data-add') === '1';
        const input_field = $(this).closest('.quantity-control-container').find('.product-quantity-input-field').eq(0);
        if (input_field.prop('disabled')) return;
        const min_val = parseInt(input_field.attr('data-minquantity'));
        const max_val = parseInt(input_field.attr('data-maxquantity'));

        if (max_val <= 0 || cart_btn.prop('disabled') && parent_card.attr('data-fromcart') != '1') return disable_button(cart_btn, true, 'Out of Stock');
        let input_val = !input_field.val() || is_whitespace(input_field.val()) ? min_val : parseInt(input_field.val().replace(/\D/g, ''));
        input_val += _is_add ? 1 : -1;
        if (input_val < min_val) input_val = min_val;
        if (input_val > max_val) input_val = max_val;
        input_field.val(input_val);
        //disable_button(cart_btn, false, 'Add to Cart');
    });
    
    //Add to cart btn
    $(document).on('click', 'button[name=add-to-cart-btn]', function(event){
        IS_MAKING_ORDER = true;
        const cart_btn = $(this);
        const parent_card = cart_btn.closest('.product-card');
        const input_field = parent_card.find('.product-quantity-input-field').eq(0);
        const min_val = parseInt(input_field.attr('data-minquantity'));
        const max_val = parseInt(input_field.attr('data-maxquantity'));

        disable_button(cart_btn, true, BSTR_BORDER_SPINNER);
        input_field.attr('disabled', true);
        let quantity = !input_field.val() || is_whitespace(input_field.val()) ? min_val : parseInt(input_field.val());

        if (quantity < min_val || quantity > max_val){
            disable_button(cart_btn, false, 'Add to Cart');
            return alert('Unable to add to cart at this time');
        }

        $.ajax({
            type: 'POST',
            url: 'https://prod-24.australiasoutheast.logic.azure.com:443/workflows/7445943fc74e4076a8e522348cc4b6a8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fYoKKxCsu6RiW4F3HN2-oGQYK6emn65S1W6qw9G-ZBM',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({'customer_uid': 'e391c7cb-e9c7-ed11-b597-00224897d329',
                                    'quantity': quantity,
                                    'map_uid': parent_card.attr('data-vendormapuid'),
                                    'product_uid': parent_card.attr('data-productuid'),
                                    'vendor_uid': parent_card.attr('data-vendoruid')}),
            complete: function(response, status, xhr){
                IS_MAKING_ORDER = false;
                input_field.val(null);
                input_field.attr('disabled', false);
                disable_button(cart_btn, false, 'Add to Cart');

                if (String(status) !== 'success') return alert('Unable to add to cart at this time');
                if (!response['responseJSON']['valid']) return process_product_out_of_quantity(false, parent_card);
                const all_ordered_quantity = response['responseJSON']['total_ordered'];
                
                parent_card.attr('data-vendorstockordered', all_ordered_quantity);
                parent_card.attr('data-maxquantity', parseInt(Math.floor((parseInt(parent_card.attr('data-vendorstockonhand')) - all_ordered_quantity) / min_val)));
                parent_card.find('[name=product-quantity-input-field]').attr('data-maxquantity', parseInt(Math.floor((parseInt(parent_card.attr('data-vendorstockonhand')) - all_ordered_quantity) / min_val)));

                CART_BUTTON.attr('data-quantity', response['responseJSON']['num_cart_items']);
                CART_BUTTON.find('[name=cart-item-num]').eq(0).text(response['responseJSON']['num_cart_items']);
                
                if (parseInt(parent_card.attr('data-maxquantity')) <= 0) return process_product_out_of_quantity(true, parent_card);
                alert(`${quantity} ${parent_card.attr('data-orderunitname')} of ${parent_card.attr('data-name')} ${quantity > 1 ? 'have' : 'has'} been added to your cart`);
            }
        });
    });

    

    $(document).on('click', 'span[name=product-info-btn]', function(){
        const parent_card = $(this).closest('.product-card');
        $('div[name=product-info-modal]').find('.modal-title').text(parent_card.attr('data-name'));
        $('div[name=product-info-modal]').find('.modal-body').empty();

        $('div[name=product-info-modal]').find('.modal-body').append(`
            ${get_product_info_markup('Vendor Code', parent_card.attr('data-vendormapocode'))}
            ${is_whitespace(parent_card.attr('data-barcode')) ? '' : get_product_info_markup('Barcode', parent_card.attr('data-barcode'))}
            ${is_whitespace(parent_card.attr('data-brand')) ? '' : get_product_info_markup('Brand', parent_card.attr('data-brand'))}
            ${is_whitespace(parent_card.find('.product-remark-container').text()) ? '' : get_product_info_markup('Remark', parent_card.find('.product-remark-container').text())}
            ${get_product_info_markup('Order by', `${parent_card.attr('data-unitsize')} ${parent_card.attr('data-orderunitname')}`)}
            ${is_whitespace(parent_card.attr('data-productsize')) ? '' : get_product_info_markup('Product Size', parent_card.attr('data-productsize'))}
            ${get_product_info_markup('Category', parent_card.attr('data-categoryname'))}
            ${get_product_info_markup('Sub-Category', parent_card.attr('data-subcategoryname'))}
            ${get_product_info_markup('Provided from', parent_card.attr('data-vendorname'))}
        `);
        $('div[name=product-info-modal]').modal('show');
    });

    PRODUCT_SEARCH_TEXT_FIELD.on('keyup change', function(){
        const _has_input = !is_whitespace($(this).val());
        disable_button(APPLY_SEARCH_BTN, !_has_input);
        if (!_has_input) return;
    });

    function write_cart_modal_header(header_dom, cart_items){
        let cart_price = 0;
        cart_items.forEach(cart_item => {cart_price += cart_item.total_price});
        header_dom.text(`${cart_items.length} product${cart_items.length > 1 ? 's' : ''} in your cart for a total of $${cart_price.toFixed(2)}`);
    }

    APPLY_SEARCH_BTN.on('click', function(){
        function _empty_result_handling(){
            disable_button(APPLY_SEARCH_BTN, false, 'Apply Search');
            alert('No product with such name exists');
        }
        disable_button(APPLY_SEARCH_BTN, true, BSTR_BORDER_SPINNER);
        $.ajax({
            type: 'POST',
            url: 'https://prod-24.australiasoutheast.logic.azure.com:443/workflows/e51d6b909daa4f9c897f29f51b296623/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BDKkNtQDX9q2pznGdElCfonzFQvEA7dsKzxtrL9n9Wo',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({'searched_txt': clean_white_space(PRODUCT_SEARCH_TEXT_FIELD.val().toLowerCase().trim())}),
            complete: function(response, status, xhr){
                if (String(status) !== 'success'){
                    disable_button(APPLY_SEARCH_BTN, false, 'Apply Search');
                     return alert('Unable to search for products at this time');
                }
                const products = response['responseJSON'];
                if (products.length < 1) return _empty_result_handling();
                console.log(products);

                let product_vendor_maps = [];
                let idx = 0;

                function retrieve_single_product_vendor_map(product_uid){
                    function _finalise_request(){
                        if (idx < products.length - 1) return idx++;
                        disable_button(APPLY_SEARCH_BTN, false, 'Apply Search');
                        const formatted_products = process_product_vendor_map(products, product_vendor_maps);
                        if (formatted_products.length < 1) return _empty_result_handling();

                        PRODUCT_CONTAINER_MODAL.find('.modal-body').empty();
                        PRODUCT_CONTAINER_MODAL.find('.modal-title').text(`Found ${formatted_products.length} product${formatted_products.length > 1 ? 's' : ''}`);
                        render_product_cards(formatted_products, PRODUCT_CONTAINER_MODAL.find('.modal-body'), true);
                        PRODUCT_CONTAINER_MODAL.modal('show');
                    }
                    $.ajax({
                        type: 'POST',
                        url: 'https://prod-25.australiasoutheast.logic.azure.com:443/workflows/6405ea920a2a4c40b9165f256a12924a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=X17KcJPoRywTI5eKRhHrmqEyfV4tybM9BHFou-rdk9Q',
                        contentType: 'application/json',
                        accept: 'application/json;odata=verbose',
                        timeout: AJAX_TIMEOUT_DURATION,
                        data: JSON.stringify({'product_uid': product_uid}),
                        complete: function(response, status, xhr){
                            if (String(status) !== 'success') return _finalise_request();
                            const product_vendor_map = response['responseJSON']['product_vendor_map'][0];
                            if (product_vendor_map === undefined) return _finalise_request();
                            product_vendor_maps.push(product_vendor_map);
                            _finalise_request();
                        }
                    });
                }

                products.forEach(product => {
                    (function(y) {
                        setTimeout(function() {
                            retrieve_single_product_vendor_map(product['prg_uomprocurementserviceproductsid']);
                            }, y * 250);
                        }(idx));
                });
                //products.map(item => item.prg_uomprocurementserviceproductsid).forEach((product_uid, idx) => {
                return;
            }
        });
    });


    // View Cart function
    CART_BUTTON.on('click', function(event){
        CART_CONTAINER_MODAL.find('.modal-footer').toggle(false);
        const cart_body_loader = `<div style='display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; width: 100%; margin-top: 1.25em;'>
                                        <br>${BSTR_BORDER_SPINNER}<br>
                                        <h5>Loading your cart...</h6>
                                    </div>`
        const modal_content_body = CART_CONTAINER_MODAL.find('.modal-content').eq(0);
        CART_CONTAINER_MODAL.find('.modal-title').text('');
        modal_content_body.find('.modal-body').empty();
        if (IS_MAKING_ORDER) return;
        modal_content_body.find('.modal-body').append(cart_body_loader);
        CART_CONTAINER_MODAL.modal('show');

        $.ajax({
            type: 'POST',
            url: 'https://prod-15.australiasoutheast.logic.azure.com:443/workflows/3e23899232174009b8be511c7a43412d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=G4Ydf5oYEVZlgQTb4JjS1UFpdaVccR8zXWrIGRtE2cs',
            contentType: 'application/json',
            accept: 'application/json;odata=verbose',
            timeout: AJAX_TIMEOUT_DURATION,
            data: JSON.stringify({"customer_uid": "e391c7cb-e9c7-ed11-b597-00224897d329", 'query_num_items_only': false}),
            complete: function(response, status, xhr){
                modal_content_body.find('.cart-item-container-section').empty();
                if (String(status) !== 'success'){
                    CART_CONTAINER_MODAL.find('.modal-title').text('ERROR');
                    alert('Unable to load your cart at this time');
                    return hide_elems_on_load(true);
                }
                CART_CONTAINER_MODAL.find('.modal-footer').toggle(response['responseJSON']['num_items_orderd'] > 0);
                if (response['responseJSON']['num_items_orderd'] < 1) {
                    CART_CONTAINER_MODAL.find('.modal-title').text("You haven't yet added any product to cart");
                    CART_CONTAINER_MODAL.find('.modal-footer').toggle(false);
                    return modal_content_body.find('.modal-body').empty();
                }
                const cart_items = response['responseJSON']['cart_items'];

                let product_vendor_maps = [];
                let products = [];
                let idx = 0;

                function retrieve_cart_item_product_info(cart_item){
                    function _finalise_request(){
                        if (idx < cart_items.length - 1) return idx++;
                        modal_content_body.find('.modal-body').empty();
                        modal_content_body.find('.modal-body').append(`<div class="cart-item-container-section"></div>`);
                        const formatted_products = process_product_vendor_map(products, product_vendor_maps, cart_items);
                        
                        render_product_cards(formatted_products, modal_content_body.find('.cart-item-container-section'), false);
                        write_cart_modal_header(CART_CONTAINER_MODAL.find('.modal-title'), formatted_products);
                        CART_CONTAINER_MODAL.find('.modal-footer').toggle(true);
                    }
                    $.ajax({
                        type: 'POST',
                        url: 'https://prod-03.australiasoutheast.logic.azure.com:443/workflows/d5232e14c5a248cfbfa4ec06581c548b/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=EXC8jJ8M0MrqyOoYImvQOMRRiJtzRFrd7JBIgWZZ-dE',
                        contentType: 'application/json',
                        accept: 'application/json;odata=verbose',
                        timeout: AJAX_TIMEOUT_DURATION,
                        data: JSON.stringify({'map_uid': cart_item['_prg_vendorcode_value'], 'product_uid': cart_item['_prg_product_value']}),
                        complete: function(response, status, xhr){
                            if (String(status) !== 'success') return _finalise_request();
                            product_vendor_maps.push(response['responseJSON']['product_vendor_map']);
                            products.push(response['responseJSON']['product']);
                            _finalise_request();
                        }
                    });
                }

                cart_items.forEach(cart_item => {
                    (function(y) {
                        setTimeout(function() {
                            retrieve_cart_item_product_info(cart_item);
                            }, y * 280);
                        }(idx));
                })
            }
        });
    });


    //Update cart
    function handle_cart_change_btn_event(calling_btn, init_update=true){
        IS_UPDATING_CART = init_update;
        CART_CONTAINER_MODAL.find('button, input').attr('disabled', IS_UPDATING_CART);
        calling_btn.empty();
        calling_btn.append(IS_UPDATING_CART ? BSTR_BORDER_SPINNER : calling_btn.attr('data-btnlabel'));
    }

    $(document).on('click', 'input[name=remove-cart-item-btn], #update-cart-btn, #clear-cart-btn', function(event){
        const calling_btn = $(this);
        handle_cart_change_btn_event(calling_btn);
        if (String(calling_btn.attr('name')) === 'remove-cart-item-btn') calling_btn.closest('.product-card').find('[name=product-quantity-input-field]').eq(0).val(0);
        let update_cart_items = [];
        CART_CONTAINER_MODAL.find('.product-card').each(function(){
            const input_field = $(this).find('[name=product-quantity-input-field]').eq(0);
            if ($(this).attr('data-fromcart') == '1' && input_field.val() && !is_whitespace(input_field.val())){
                const new_quantity = String(calling_btn.attr('name')) === 'clear-cart-btn' ? 0 : parseInt(input_field.val().replace(/\D/g, ''));
                if (!isNaN(new_quantity) && new_quantity != parseInt($(this).attr('data-numincart'))){
                    input_field.val(new_quantity);
                    update_cart_items.push({
                        'user_uid': 'e391c7cb-e9c7-ed11-b597-00224897d329',
                        'cart_uid': $(this).attr('data-cartuid'),
                        'map_uid': $(this).attr('data-vendormapuid'),
                        'new_quantity': new_quantity,
                        'old_quantity': parseInt($(this).attr('data-numincart')),
                        'min_quantity': parseInt($(this).attr('data-minquantity')),
                    });
                }
            }
        });

        let idx = 0;

        function ajax_update_cart_item(update_cart_item){
            function _finalise_request(){
                if (idx < update_cart_items.length - 1) return idx++;
                handle_cart_change_btn_event(calling_btn, false);
                let new_cart_items = [];
                CART_CONTAINER_MODAL.find('.product-card').each(function(){
                    new_cart_items.push({'total_price': parseFloat($(this).attr('data-totalprice'))})
                });
                new_cart_items.length < 1 ? CART_CONTAINER_MODAL.find('.modal-title').text("You haven't yet added any product to cart") : write_cart_modal_header(CART_CONTAINER_MODAL.find('.modal-title'), new_cart_items);
                CART_CONTAINER_MODAL.find('.modal-footer').toggle(new_cart_items.length > 0);

                CART_BUTTON.attr('data-quantity', CART_CONTAINER_MODAL.find('.product-card').length);
                CART_BUTTON.find('[name=cart-item-num]').eq(0).text(CART_CONTAINER_MODAL.find('.product-card').length);
            }

            $.ajax({
                type: 'POST',
                url: 'https://prod-23.australiasoutheast.logic.azure.com:443/workflows/8247cfac5c404269bf4f3413aacf0e72/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4tRyjnLNq-EUzh7gX67vYhMwpqLEPNu-cIXcdN_0kPQ',
                contentType: 'application/json',
                accept: 'application/json;odata=verbose',
                timeout: AJAX_TIMEOUT_DURATION,
                data: JSON.stringify(update_cart_item),
                complete: function(response, status, xhr){
                    if (String(status) !== 'success') return _finalise_request();
                    update_cart_item['update_success'] = response['responseJSON']['update_success'];

                    const cart_item_grid_elem = CART_CONTAINER_MODAL.find(`.product-card[data-cartuid='${update_cart_item.cart_uid}']`).eq(0);
                    if (cart_item_grid_elem === undefined) return _finalise_request();
                    const input_field = cart_item_grid_elem.find('[name=product-quantity-input-field]').eq(0);
                    const input_val = parseInt(update_cart_item.update_success ? update_cart_item.new_quantity : update_cart_item.old_quantity);
                    input_field.val(input_val);

                    const cart_item_price = input_val * parseFloat(cart_item_grid_elem.attr('data-vendorprice'));

                    cart_item_grid_elem.attr('data-numincart', input_val);
                    cart_item_grid_elem.attr('data-totalprice', cart_item_price);
                    cart_item_grid_elem.attr('data-vendorstockordered', response['responseJSON']['product_vendor_map']['prg_stockorderd']);
                    input_field.attr('data-maxquantity', parseInt(Math.floor((response['responseJSON']['product_vendor_map']['prg_stockonhand'] - response['responseJSON']['product_vendor_map']['prg_stockorderd'] + input_val) / update_cart_item.min_quantity)));
                    if (input_val < 1 && update_cart_item['update_success']) cart_item_grid_elem.remove();
                    _finalise_request();
                }
            });
        }
        if (update_cart_items.length < 1) {
            CART_BUTTON.attr('data-quantity', CART_CONTAINER_MODAL.find('.product-card').length);
            CART_BUTTON.find('[name=cart-item-num]').eq(0).text(CART_CONTAINER_MODAL.find('.product-card').length);
            return handle_cart_change_btn_event(calling_btn, false);
        }
        update_cart_items.forEach(update_cart_item => {
            (function(y) {
                setTimeout(function() {
                    ajax_update_cart_item(update_cart_item);
                    }, y * 280);
                }(idx));
        });
    });
});