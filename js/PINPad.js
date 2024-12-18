class PINPad {
    
    constructor ({element, postEndpoint, maxNumbers = Infinity}) {
        this.element = {
            main: element,
            numPad: element.querySelector(".PINPad__numpad"),
            textDisplay: element.querySelector(".PINPad__text")
        };

        this.postEndpoint = postEndpoint;
        this.maxNumbers = maxNumbers;
        this.PIN = "";
        this._generatePad();
    }

    _generatePad() {
        const padLayout = [
            "1", "2", "3",
            "4", "5", "6",
            "7", "8", "9",
            "backspace", "0", "done"
        ];

        padLayout.forEach(key => {
            const insertBreak = key.search(/[369]/) !== -1;
            const keyButton = document.createElement("div");

            switch (key) {
                case "done":
                    keyButton.classList.add("PINPad__Enterkey");    
                    break;
                case "backspace":
                    keyButton.classList.add("PINPad__Backkey");    
                    break;
                default:
                    keyButton.classList.add("PINPad__key");
                    break;
            }
           
            keyButton.classList.toggle("material-icons", isNaN(key));
            keyButton.textContent = key;
            keyButton.addEventListener("click", () => { this._handleKeyPress(key) });
            this.element.numPad.appendChild(keyButton);

            if (insertBreak) {
                this.element.numPad.appendChild(document.createElement("br"));
            }
        });
    }

    _handleKeyPress(key) {
        switch (key) {
            case "backspace":
                this.PIN = this.PIN.substring(0, this.PIN.length - 1);
                break;
            case "done":
                //this._postData();

                break;
            default:
                if (this.PIN.length < this.maxNumbers && !isNaN(key)) {
                    this.PIN += key;
                }
                break;
        }

        this._updateValueText();
    }

    _updateValueText() {
        let usd = Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            useGrouping: true,
        });
    
        //this.element.textDisplay.value = "_".repeat(this.PIN.length);
        //this.element.textDisplay.value =`$ ${(this.PIN / 100).toFixed(2)}`;  
        this.element.textDisplay.value = usd.format(this.PIN/100);  
        //this.element.textDisplay.classList.remove("PINPad__text--error");
    }

    _postData() {
        if (this.PIN.length > 0) {
		fetch(this.postEndpoint, {
		method: "post",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded"
        },
		body: `Digits=${this.PIN}`
		})  
        .then(function(response) {
		return response.text();
		})
        .then(function(data) {
		alert(data);
		});
  		this.PIN = "";
	   }
    }
}

new PINPad({
    element: document.getElementById("mainPINPad"),
    postEndpoint: "https://paoli.magensa.net:8080/events.html",
    maxNumbers: 9	
});


