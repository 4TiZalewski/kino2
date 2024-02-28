// @ts-check

/**
 * @type {HTMLButtonElement | null}
 */
const create_button = document.querySelector("#create");
/**
 * @type {HTMLInputElement | null}
 */
const miejsca = document.querySelector("#miejsca");
/**
 * @type {HTMLInputElement | null}
 */
const miejsca_na_rzad = document.querySelector("#miejsca-na-rzad");
/**
 * @type {HTMLElement | null}
 */
const cinema_display = document.querySelector(".cinema");
/**
 * @type {HTMLButtonElement | null}
 */
const reserve_button = document.querySelector("#reserve");
/**
 * @type {HTMLInputElement | null}
 */
const tickets_adult_nullable = document.querySelector("#tickets-adult");
/**
 * @type {HTMLInputElement | null}
 */
const tickets_child_nullable = document.querySelector("#tickets-child");
/**
 * @type {HTMLUListElement | null}
 */
const reserved_seats_display_nullable = document.querySelector(".reserved-seats-display");
/**
 * @type {Array<number>}
 */
const reserved_seats = [];

/**
 * @type {number}
 */
let current_ilosc_miejsc = 0;
/**
 * @type {number}
 */
let current_ilosc_miejsc_na_rzad = 0;

if (create_button && miejsca && miejsca_na_rzad && cinema_display && tickets_adult_nullable && tickets_child_nullable && reserved_seats_display_nullable) {
    const tickets_adult = /** @type {HTMLInputElement} */ (tickets_adult_nullable);
    const tickets_child = /** @type {HTMLInputElement} */ (tickets_child_nullable);
    const reserved_seats_display = /** @type {HTMLUListElement} */ (reserved_seats_display_nullable);

    tickets_adult.addEventListener("keydown", function(event) {
        event.preventDefault();
    });

    tickets_child.addEventListener("keydown", function(event) {
        event.preventDefault();
    });
    
    tickets_adult.addEventListener("change", function(event) {
        update_tickets_count(UPDATE_TICKETS_MODE.CHILD);
    });

    tickets_child.addEventListener("change", function(event) {
        update_tickets_count(UPDATE_TICKETS_MODE.ADULT);
    });

    create_button.addEventListener("click", function(event) {
        event.preventDefault();

        /**
         * @type {number}
         */
        const ilosc_miejsc = Number(miejsca.value);
        /**
         * @type {number}
         */
        const ilosc_miejsc_na_rzad = Number(miejsca_na_rzad.value);

        while (cinema_display.firstChild) {
            cinema_display.removeChild(cinema_display.firstChild);
        }

        if (
            ilosc_miejsc > 1 &&
            ilosc_miejsc < 1000 &&
            ilosc_miejsc_na_rzad > 1 &&
            ilosc_miejsc_na_rzad < 100
        ) {
            current_ilosc_miejsc = ilosc_miejsc;
            current_ilosc_miejsc_na_rzad = ilosc_miejsc_na_rzad;
            /**
             * @type {number}
             */
            const columns = Math.floor(ilosc_miejsc / ilosc_miejsc_na_rzad);
            /**
             * @type {boolean}
             */
            const next_row = !(ilosc_miejsc % ilosc_miejsc_na_rzad == 0);
            /**
             * @type {number}
             */
            let seat_number = 1;

            for(let column = 1; column <= columns; column++) {
                create_seat_row(seat_number, column, ilosc_miejsc_na_rzad, cinema_display);
                seat_number += ilosc_miejsc_na_rzad;
            }

            if (next_row) {
                const additional_seats = ilosc_miejsc % ilosc_miejsc_na_rzad;
                seat_number = ilosc_miejsc - additional_seats + 1;
                create_seat_row(seat_number, columns + 1, additional_seats, cinema_display);
            }
        } else {
            // Ojojoj
            alert("Za dużo!");
        }

        configure_price();
        show_reserved_seats(reserved_seats_display);
        console.log(`Reserved seats: ${reserved_seats}`);
        refresh_cinema();

    });
}

if (reserve_button) {
    reserve_button.addEventListener("click", function(/** @type {Event} */ event) {
        event.preventDefault();

        const number_reserved_seats = count_reserved_seats();
        configure_price(number_reserved_seats);
        if (reserved_seats_display_nullable) {
            const reserved_seats_display = /** @type {HTMLUListElement} */ (reserved_seats_display_nullable);
            show_reserved_seats(reserved_seats_display);
        }

        // Clear
        format_reserved_seats();
        if (tickets_adult_nullable && tickets_child_nullable) {
            const tickets_adult = /** @type {HTMLInputElement} */ (tickets_adult_nullable);
            const tickets_child = /** @type {HTMLInputElement} */ (tickets_child_nullable);
            while (reserved_seats.length != 0) {
                reserved_seats.pop();
            }

            tickets_adult.value = "0";
            tickets_adult.min = "0";
            tickets_adult.max = "0";

            tickets_child.value = "0";
            tickets_child.min = "0";
            tickets_child.max = "0";
        }

        update_tickets_count();
    });
}

refresh_cinema();



/**
 * @param {HTMLUListElement} display 
 */
function show_reserved_seats(display) {
    reserved_seats.sort((a, b) => a - b);
    reserved_seats.forEach(seat_nr => {
        const entry = document.createElement("li");
        const rzad = Math.floor((seat_nr - 1) / current_ilosc_miejsc_na_rzad) + 1;
        entry.innerText = `Rząd nr: ${rzad}, miejsce nr: ${seat_nr}`;

        display.appendChild(entry);
    });
}

/**
 * @param {number} number_reserved_seats 
 */
function configure_price(number_reserved_seats = 0) {
    /**
     * @type {HTMLHeadingElement | null}
     */
    const price_text = document.querySelector(".cena");
    /**
     * @type {HTMLDivElement | null}
     */
    const price_wrapper = document.querySelector(".cena-wrapper");
    /**
     * @type {HTMLInputElement | null}
     */
    const adult_current_price_element = document.querySelector("#price-setting-adult");
    /**
     * @type {HTMLInputElement | null}
     */
    const child_current_price_element = document.querySelector("#price-setting-child");

    if (price_wrapper && price_text && adult_current_price_element && child_current_price_element && tickets_adult_nullable && tickets_child_nullable) {
        const tickets_adult = /** @type {HTMLInputElement} */ (tickets_adult_nullable);
        const tickets_child = /** @type {HTMLInputElement} */ (tickets_child_nullable);

        if (number_reserved_seats > 0) {
            price_wrapper.style.display = "block";

            /**
             * @type {number}
             */
            let adult_current_price = Number(adult_current_price_element.value);
            /**
             * @type {number}
             */
            let child_current_price = Number(child_current_price_element.value);

            if (isNaN(adult_current_price) || isNaN(child_current_price)) {
                adult_current_price = 0;
                child_current_price = 0;
            }

            /**
             * @type {number}
             */
            const final_price = Number(tickets_adult.value) * adult_current_price + Number(tickets_child.value) * child_current_price;

            price_text.innerText = `${final_price}`;
            return;
        }

        price_wrapper.style.display = "none";
    }
}

function format_reserved_seats() {
    /**
     * @type {NodeListOf<HTMLButtonElement>}
     */
    const buttons = document.querySelectorAll(".seat");
    buttons.forEach((/** @type {ChildNode} */ element) => {
        if (element instanceof HTMLButtonElement) {
            const button = /** @type {HTMLButtonElement} */ (element);
            const button_id = Number(button.innerText);
            if (reserved_seats.indexOf(button_id) != undefined && button.value === "0") {
                format_button(button, 2);
            }
        }
    });
}

/**
 * @returns {number}
 */
function count_reserved_seats() {
    return reserved_seats.length;
}

/**
 * @param {HTMLButtonElement} button 
 */
function register_seat_callback(button) {
    button.addEventListener("click", function(/** @type {MouseEvent} */ event) {
        event.preventDefault();

        /**
         * @type {EventTarget | null}
         */
        const event_target = event.target;
        if (event_target == null) {
            return;
        }

        const button = /** @type {HTMLButtonElement} */ (event_target);
        click_button(button);
        update_tickets_count();
    });
}

/**
 * @readonly
 * @enum {number}
 */
const UPDATE_TICKETS_MODE = {
    NONE: 0,
    ADULT: 1,
    CHILD: 2
};

/**
 * @param {UPDATE_TICKETS_MODE} mode
 */
function update_tickets_count(mode = UPDATE_TICKETS_MODE.NONE) {
    /**
     * @type {HTMLInputElement | null}
     */
    const tickets_adult_nullable = document.querySelector("#tickets-adult");

    /**
     * @type {HTMLInputElement | null}
     */
    const tickets_child_nullable = document.querySelector("#tickets-child");

    if (tickets_adult_nullable && tickets_child_nullable) {
        const tickets_adult = /** @type {HTMLInputElement} */ (tickets_adult_nullable);
        const tickets_child = /** @type {HTMLInputElement} */ (tickets_child_nullable);

        /**
         * @type {number}
         */
        const amount_reserved_seats = count_reserved_seats();
        /**
         * @type {number}
         */
        const tickets_child_value = Number(tickets_child.value);
        /**
         * @type {number}
         */
        const tickets_adult_value = Number(tickets_adult.value);

        tickets_adult.max = `${amount_reserved_seats}`;
        tickets_child.max = `${amount_reserved_seats}`;
        
        switch (mode) {
            case UPDATE_TICKETS_MODE.ADULT:
                tickets_adult.min = `${amount_reserved_seats - tickets_child_value}`;
                tickets_adult.value = `${amount_reserved_seats - tickets_child_value}`;
                tickets_child.min = `${amount_reserved_seats - tickets_adult_value + 1}`;
                break;
            case UPDATE_TICKETS_MODE.CHILD:
                tickets_child.min = `${amount_reserved_seats - tickets_adult_value}`;
                tickets_child.value = `${amount_reserved_seats - tickets_adult_value}`;
                tickets_adult.min = `${amount_reserved_seats - tickets_child_value + 1}`;
                break;
            case UPDATE_TICKETS_MODE.NONE:
                if (amount_reserved_seats - tickets_child_value < 0) {
                    tickets_child.value = `${amount_reserved_seats}`;
                } else {
                    tickets_adult.value = `${amount_reserved_seats - tickets_child_value}`;
                }

                break;
        }

    } else {
        console.error("No tickets selection elements!");
    }
}

/**
 * @param {HTMLButtonElement} button 
 */
function click_button(button) {
    /**
     * @type {number}
     */
    const button_value = Number(button.value);

    switch(button_value) {
        case 0:
            button.style.backgroundColor = "green";
            button.value = "1";
            reserved_seats.splice(reserved_seats.indexOf(Number(button.innerText)), 1);
            break;
        case 1:
            button.style.backgroundColor = "red";
            button.value = "0";
            reserved_seats.push(Number(button.innerText));
            break;
        case 2:
            button.style.backgroundColor = "gray";
            reserved_seats.splice(reserved_seats.indexOf(Number(button.innerText)), 1);
            break;
        default:
            console.error(`Invalid button value!: "${button_value}"`);
    }
}

/**
 * @param {HTMLButtonElement} button 
 * @param {number} mode
 */
function format_button(button, mode) {
    button.style.width = "2.5rem";
    switch(mode) {
        case 0:
            button.style.backgroundColor = "red";
            button.value = "0";
            break;
        case 1:
            button.style.backgroundColor = "green";
            button.value = "1";
            break;
        case 2:
            button.style.backgroundColor = "gray";
            button.value = "2";
            break;
        default:
            console.error(`Invalid button value!: "${mode}"`);
    }
}

/**
 * @param {number} seat_number_start 
 * @param {number} row_number 
 * @param {number} number_of_seats 
 * @param {Element} parent
 */
function create_seat_row(seat_number_start, row_number, number_of_seats, parent) {
    /**
     * @type {HTMLDivElement}
     */
    const row_item = document.createElement("div");

    /**
     * @type {HTMLHeadElement}
     */
    const row_number_indicator = document.createElement("h4");
    row_number_indicator.className = "row-indicator";
    row_number_indicator.innerText = `${row_number}`;
    row_item.appendChild(row_number_indicator);
    
    /**
     * @type {number}
     */
    let seat_number = seat_number_start;

    for (let row = 1; row <= number_of_seats; row++) {
        /**
         * @type {HTMLButtonElement}
         */
        const button = document.createElement("button");
        button.className = "seat";
        button.innerText = `${seat_number}`;

        format_button(button, 1);
        register_seat_callback(button);

        row_item.appendChild(button);
        seat_number += 1;
    }

    parent.appendChild(row_item);
}

function refresh_cinema() {
    /**
     * @type {NodeListOf<HTMLButtonElement>}
     */
    const seats = document.querySelectorAll(".seat");
    /**
     * @type {HTMLDivElement | null}
     */
    const cinema_wrapper = document.querySelector(".cinema-wrapper");

    if (cinema_wrapper) {
        if (
            seats.length < 1
        ) {
            cinema_wrapper.style.display = "none";
        } else {
            cinema_wrapper.style.display = "flex";
        }
    }
}