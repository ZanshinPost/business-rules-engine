///<reference path='../../typings/q/q.d.ts'/>

///<reference path='errors.ts'/>
///<reference path='validators.ts'/>

module Validation {

    /**
     * @ngdoc module
     * @name Validation
     *
     *
     * @description
     * # Validation (core module)
     * The module itself contains the essential components for an validation engine to function. The table below
     * lists a high level breakdown of each of the components (object, functions) available within this core module.
     *
     * <div doc-module-components="Validation"></div>
     */


    /**
     * It defines validation function.
     */
    export interface IValidate { (args: IError): void; }

    /**
     * It represents named validation function.
     */
    export interface IValidatorFce {
        Name:string;
        ValidationFce: IValidate;
    }

    /**
     * This class represents custom validator.
     */
    export interface IValidator {
        Validate(context:any): boolean;
        Error: IError;
    }

    /**
     * It represents abstract validator for type of <T>.
     */
    export interface IAbstractValidator<T>{
        RuleFor(prop:string,validator:IPropertyValidator);
        ValidationFor(prop:string,validator:IValidatorFce);
        ValidatorFor<K>(prop:string,validator:IAbstractValidator<K>);

        //Validators:{ [name: string]: Array<IPropertyValidator> ; };

        /**
         * It creates new concrete validation rule and assigned data context to this rule.
         * @param name of the rule
         * @constructor
         */
        CreateRule(name:string):IAbstractValidationRule<any>;
        CreateAbstractRule(name:string):IAbstractValidationRule<any>;
        CreateAbstractListRule(name:string):IAbstractValidationRule<any>;

        /**
         * return true if this validation rule is intended for list of items, otherwise true
         */
        ForList:boolean;
    }

    /**
     * It represents concrete validation rule for type of <T>.
     */
    export interface IAbstractValidationRule<T> {

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures.
         */
        Validate(context:T):IValidationResult

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures asynchronoulsy.
         */
        ValidateAsync(context:T):Q.Promise<IValidationResult>
        /**
         * Performs validation and async validation using a validation context.
         */

        ValidateAll(context:T):void;

        /**
         * Performs validation and async validation using a validation context for a passed field.
         */
        ValidateField(context:T, propName:string):void;

        /**
         * Return validation results.
         */
        ValidationResult: IValidationResult


        Rules:{ [name: string]: IPropertyValidationRule<T> ; }
        Validators: { [name: string]: IValidator ; }
        Children:{ [name: string]: AbstractValidationRule<any> ; }
    }


    /**
     * It represents property validation rule for type of <T>.
     */
    export interface IPropertyValidationRule<T> {
        /**
         *The validators that are grouped under this rule.
         */
        Validators:{[name:string]:any};


        /**
         * Performs validation using a validation context and returns a collection of Validation Failures.
         */
        Validate(context:IValidationContext<T>):Array<IValidationFailure>;

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures asynchronoulsy.
         */
        ValidateAsync(context:IValidationContext<T>):Q.Promise<Array<IValidationFailure>>;

    }


    /**
     *  It represents a data context for validation rule.
     */
    export interface IValidationContext<T> {
        /**
         * Return current value.
         */
        Value:string;

        /**
         * Return property name for current data context.
         */
        Key:string;

        /**
         * Data context for validation rule.
         */
        Data:T
    }

    /**
     *
     * @ngdoc object
     * @name  AbstractValidator
     * @module Validation
     *
     *
     * @description
     * It enables to create custom validator for your own abstract object (class) and to assign validation rules to its properties.
     * You can assigned these rules
     *
     * +  property validation rules - use _RuleFor_ property
     * +  property async validation rules - use _RuleFor_ property
     * +  shared validation rules - use _ValidationFor_ property
     * +  custom object validator - use _ValidatorFor_ property - enables composition of child custom validators
     */
    export class AbstractValidator<T> implements IAbstractValidator<T> {

        public Validators:{ [name: string]: Array<IPropertyValidator> ; } = {};
        public AbstractValidators:{ [name: string]: IAbstractValidator<any> ; } = {};
        public ValidationFunctions:{[name:string]: Array<IValidatorFce>;} = {};

        public RuleFor(prop:string, validator:IPropertyValidator) {
            if (this.Validators[prop] == undefined) {
                this.Validators[prop] = [];
            }

            this.Validators[prop].push(validator);
        }

        public ValidationFor(prop:string,fce:IValidatorFce) {
            if (this.ValidationFunctions[prop] == undefined) {
                this.ValidationFunctions[prop] = [];
            }

            this.ValidationFunctions[prop].push(fce);
        }

        public ValidatorFor<K>(prop:string,validator:IAbstractValidator<K>, forList?:boolean) {

            validator.ForList = forList;
            this.AbstractValidators[prop] = validator;
        }

        public CreateAbstractRule(name:string){
            return new AbstractValidationRule<T>(name, this);
        }
        public CreateAbstractListRule(name:string){
            return new AbstractListValidationRule<T>(name, this);
        }

        public CreateRule(name:string){
            return new AbstractValidationRule<T>(name, this);
        }


        /**
        * Return true if this validation rule is intended for list of items, otherwise true.
        */
        public ForList:boolean = false;

    }

    /**
     *
     * @ngdoc object
     * @name  AbstractValidationRule
     * @module Validation
     *
     *
     * @description
     * It represents concreate validator for custom object. It enables to assign validation rules to custom object properties.
     */
    export class AbstractValidationRule<T> implements IAbstractValidationRule<T>{
        public ValidationResult:IValidationResult;
        public Rules:{ [name: string]: IPropertyValidationRule<T> ; } = {};
        public Validators: { [name: string]: IValidator ; } = {};
        public Children:{ [name: string]: AbstractValidationRule<any> ; } = {};

        /**
         * Return true if this validation rule is intended for list of items, otherwise true.
         */
        public ForList:boolean = false;

        constructor(public Name:string,public validator:AbstractValidator<T>, forList?:boolean){
            this.ValidationResult = new CompositeValidationResult(this.Name);

            if (!forList) {
                _.each(this.validator.Validators, function (val, key) {
                    this.createRuleFor(key);
                    _.each(val, function (validator) {
                        this.Rules[key].AddValidator(validator);
                    }, this);
                }, this);

                _.each(this.validator.ValidationFunctions, function (val:Array<IValidatorFce>) {
                    _.each(val, function (validation) {
                        var validator = this.Validators[validation.Name];
                        if (validator == undefined) {
                            validator = new Validator(validation.Name, validation.ValidationFce);
                            this.Validators[validation.Name] = validator;
                            this.ValidationResult.Add(validator);
                        }
                    }, this)
                }, this);

                this.addChildren();
            }

        }

        public addChildren(){
            _.each(this.validator.AbstractValidators, function(val, key){
                var validationRule;
                if (val.ForList){
                    validationRule = val.CreateAbstractListRule(key);
                }
                else {
                    validationRule = val.CreateAbstractRule(key);
                }
                this.Children[key] = validationRule;
                this.ValidationResult.Add(validationRule.ValidationResult);
            },this);

        }

        public SetOptional(fce:IOptional){

            this.ValidationResult.Optional = fce;
//            _.each(this.Rules, function(value:IValidationResult, key:string){value.Optional = fce;});
//            _.each(this.Validators, function(value:any, key:string){value.Optional = fce;});
//            _.each(this.Children, function(value:any, key:string){value.SetOptional(fce);});
        }

        private createRuleFor(prop:string){
            var propValidationRule = new PropertyValidationRule(prop);
            this.Rules[prop] = propValidationRule;
            this.ValidationResult.Add(propValidationRule);

        }

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures.
         */
        public Validate(context:T):IValidationResult{

            _.each(this.Children,function(val,key){
                if (context[key] === undefined) context[key] = {};
                val.Validate(context[key]);
            },this);


            for (var propName in this.Rules){
                var rule = this.Rules[propName];
                rule.Validate(new ValidationContext(propName,context));
            }

            _.each (this.validator.ValidationFunctions, function (valFunctions:Array<IValidatorFce>) {
                _.each(valFunctions, function (valFce) {
                    var validator = this.Validators[valFce.Name];
                    if (validator != undefined) validator.Validate(context);
                },this)
            },this);

            return this.ValidationResult;
        }

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures asynchronoulsy.
         */
        public ValidateAsync(context:T):Q.Promise<IValidationResult>{
            var deferred = Q.defer<IValidationResult>();

            var promises = [];
            _.each(this.Children,function(val,key){
                promises.push(val.ValidateAsync(context[key]));
            },this);

            for (var propName in this.Rules){
                var rule = this.Rules[propName];
                promises.push(rule.ValidateAsync(new ValidationContext(propName,context)));
            }
            var self = this;
            Q.all(promises).then(function(result){deferred.resolve(self.ValidationResult);});

            return deferred.promise;
        }

        ValidateAll(context:T){
            this.Validate(context);
            this.ValidateAsync(context);
        }
        ValidateField(context:T, propName:string){
            var childRule = this.Children[propName];
            if (childRule != undefined) childRule.Validate(context[propName]);

            var rule = this.Rules[propName];
            if (rule != undefined) {
                var valContext = new ValidationContext(propName, context);
                rule.Validate(valContext);
                rule.ValidateAsync(valContext);
            }
            var validationFces = this.validator.ValidationFunctions[propName];
            if (validationFces != undefined) {
                _.each(validationFces, function (valFce) {
                    var validator = this.Validators[valFce.Name];
                    if (validator != undefined) validator.Validate(context);
                }, this);
            }
        }

    }


    /**
     *
     * @ngdoc object
     * @name  AbstractListValidationRule
     * @module Validation
     *
     *
     * @description
     * It represents an validator for custom object. It enables to assign rules to custom object properties.
     */
    export class AbstractListValidationRule<T> extends AbstractValidationRule<T> {

        constructor(public Name:string, public validator:AbstractValidator<T>) {
            super(Name, validator, true);
        }


        /**
         * Performs validation using a validation context and returns a collection of Validation Failures.
         */
        public Validate(context:any):IValidationResult {

            //super.Validate(context);


            this.NotifyListChanged(context);
            for (var i = 0; i != context.length; i++) {
                var validationRule = this.getValidationRule(i);
                if (validationRule != undefined)  validationRule.Validate(context[i]);
            }

            return this.ValidationResult;
        }

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures asynchronoulsy.
         */
        public ValidateAsync(context:any):Q.Promise<IValidationResult>{
            var deferred = Q.defer<IValidationResult>();

            var promises = [];

            this.NotifyListChanged(context);
            for (var i = 0; i != context.length; i++) {
                var validationRule = this.getValidationRule(i);
                if (validationRule != undefined) promises.push(validationRule.ValidateAsync(context[i]));
            }
            var self = this;
            Q.all(promises).then(function(result){deferred.resolve(self.ValidationResult);});

            return deferred.promise;
        }

        private getValidationRule(i:number) {
            var keyName = this.getIndexedKey(i);
            return this.Children[keyName];
        }
        private getIndexedKey(i:number){
            return this.Name + i.toString();
        }

        public NotifyListChanged(list:Array<any>) {
            for (var i = 0; i != list.length; i++) {
                var validationRule = this.getValidationRule(i);
                if (validationRule == undefined) {
                    var keyName = this.getIndexedKey(i);
                    validationRule = this.validator.CreateAbstractRule(keyName);
                    this.Children[keyName] = validationRule;
                    this.ValidationResult.Add(validationRule.ValidationResult);
                }
            }
        }
    }

     /**
     *
     * @ngdoc object
     * @name  ValidationContext
     * @module Validation
     *
     *
     * @description
     * It represents a data context for validation rule.
     */
    export class ValidationContext<T> implements IValidationContext<T> {

        constructor(public Key:string, public Data: T) {
        }
        public get Value(): any {
            return this.Data[this.Key];
        }
    }


    export class MessageLocalization {

        static customMsg = "Please, fix the field.";

        static defaultMessages = {
            "required": "This field is required.",
            "remote": "Please fix the field.",
            "email": "Please enter a valid email address.",
            "url": "Please enter a valid URL.",
            "date": "Please enter a valid date.",
            "dateISO": "Please enter a valid date ( ISO ).",
            "number": "Please enter a valid number.",
            "digits": "Please enter only digits.",
            "signedDigits": "Please enter only signed digits.",
            "creditcard": "Please enter a valid credit card number.",
            "equalTo": "Please enter the same value again.",
            "maxlength": "Please enter no more than {MaxLength} characters..",
            "minlength": "Please enter at least {MinLength} characters.",
            "rangelength": "Please enter a value between {MinLength} and {MaxLength} characters long.",
            "range": "Please enter a value between {Min} and {Max}.",
            "max": "Please enter a value less than or equal to {Max}.",
            "min": "Please enter a value greater than or equal to {Min}.",
            "step": "Please enter a value with step {Step}.",
            "contains": "Please enter a value from list of values. Attempted value '{AttemptedValue}'.",
            "mask": "Please enter a value corresponding with {Mask}.",
            "custom": MessageLocalization.customMsg
        };


        static ValidationMessages = MessageLocalization.defaultMessages;

        static GetValidationMessage(validator:any) {
            var msgText = MessageLocalization.ValidationMessages[validator.tagName];
            if (msgText == undefined || msgText == "" || !_.isString(msgText)) {
                msgText = MessageLocalization.customMsg;
            }

            return Validation.StringFce.format(msgText, validator);
        }
    }

    /**
     *
     * @ngdoc object
     * @name  PropertyValidationRule
     * @module Validation
     *
     *
     * @description
     * It represents a property validation rule. The property has assigned collection of property validators.
     */
    export class PropertyValidationRule<T> extends ValidationResult implements  IPropertyValidationRule<T> {

        public Validators:{[name:string]: any} = {};
        public ValidationFailures:{[name:string]: IValidationFailure} = {};
        //public AsyncValidationFailures:{[name:string]: IAsyncValidationFailure} = {};

        constructor(public Name:string, validatorsToAdd?:Array<IPropertyValidator>) {
            super(Name);


            for (var index in validatorsToAdd) {
                this.AddValidator(validatorsToAdd[index]);
            }


        }
        public AddValidator(validator:any){
            this.Validators[validator.tagName] = validator;
            this.ValidationFailures[validator.tagName] = new ValidationFailure(new Error(),!!validator.isAsync);
        }



        public get Errors():Array<IError> {
            return _.map(_.values(this.ValidationFailures), function (item:IValidationFailure) {
                return item.Error;
            });
        }

        public get HasErrors():boolean {
            if (this.Optional != undefined && _.isFunction(this.Optional) && this.Optional()) return false;
            return _.some(_.values(this.Errors), function (error) {
                return error.HasError;
            });
        }


        public get ErrorCount():number {
            return this.HasErrors ? 1 : 0;
        }

        public get ErrorMessage():string {
            if (!this.HasErrors) return "";
            return _.reduce(_.values(this.Errors), function (memo, error:IError) {
                return memo + error.ErrorMessage;
            }, "");
        }
        public get TranslateArgs():Array<IErrorTranslateArgs>{
            if (!this.HasErrors) return [];
            var newArray = [];
             _.each(_.values(this.Errors), function (error:IError) {
                if (error.HasError) newArray.push(error.TranslateArgs);
            });
            return newArray;
        }

        /**
         * Performs validation using a validation context and returns a collection of Validation Failures.
         */
        Validate(context:IValidationContext<T>):Array<IValidationFailure> {
            try {
                return this.ValidateEx(context.Value);

            } catch (e) {
                //if (this.settings.debug && window.console) {
                console.log("Exception occurred when checking element " + context.Key + ".", e);
                //}
                throw e;
            }
        }

        ValidateEx(value:any):Array<IValidationFailure> {

            var lastPriority:number = 0;
            var shortCircuited:boolean = false;

            for (var index in this.ValidationFailures) {

                var validation:IValidationFailure = this.ValidationFailures[index];
                if (validation.IsAsync) continue;
                var validator:IPropertyValidator = this.Validators[index];

                try {
                    var priority = 0;
                    if (shortCircuited && priority > lastPriority) {
                        validation.Error.HasError = false;
                    } else {

                        var hasError = ((value===undefined || value === null) && validator.tagName!="required")?false: !validator.isAcceptable(value);

                        validation.Error.HasError = hasError;
                        validation.Error.TranslateArgs = { TranslateId:validator.tagName, MessageArgs:_.extend(validator,{AttemptedValue: value})};
                        validation.Error.ErrorMessage = hasError ? MessageLocalization.GetValidationMessage(validation.Error.TranslateArgs.MessageArgs) : "";

                        shortCircuited = hasError;
                        lastPriority = priority;
                    }

                } catch (e) {
                    //if (this.settings.debug && window.console) {
                    console.log("Exception occurred when checking element'" + validator.tagName + "' method.", e);
                    //}
                    throw e;
                }
            }
            return _.filter(this.ValidationFailures,function(item){return !item.IsAsync;});
        }


        /**
         * Performs validation using a validation context and returns a collection of Validation Failures asynchronoulsy.
         */
        ValidateAsync(context:IValidationContext<T>):Q.Promise<Array<IValidationFailure>> {
            return this.ValidateAsyncEx(context.Value);
        }
            /**
         * Performs validation using a validation context and returns a collection of Validation Failures asynchronoulsy.
         */
        ValidateAsyncEx(value:string):Q.Promise<Array<IValidationFailure>> {
            var deferred = Q.defer<Array<IValidationFailure>>();
            var promises = [];
            for (var index in this.ValidationFailures) {
                var validation:IValidationFailure = this.ValidationFailures[index];
                if (!validation.IsAsync) continue;
                var validator:IAsyncPropertyValidator = this.Validators[index];

                try {

                    var hasErrorPromise = ((value===undefined || value === null) && validator.tagName!="required")?Q.when(true):validator.isAcceptable(value);
                    hasErrorPromise.then(function (result) {
                        var hasError = !result;

                        validation.Error.HasError = hasError;
                        validation.Error.TranslateArgs = { TranslateId:validator.tagName, MessageArgs:_.extend(validator,{AttemptedValue: value})};
                        validation.Error.ErrorMessage = hasError ? MessageLocalization.GetValidationMessage(validation.Error.TranslateArgs.MessageArgs) : "";


                    });

                    promises.push(hasErrorPromise);

                } catch (e) {
                    //if (this.settings.debug && window.console) {
                    console.log("Exception occurred when checking element'" + validator.tagName + "' method.", e);
                    //}
                    throw e;
                }
            }

            var self = this;
            Q.all(promises).then(function(result){deferred.resolve(_.filter(self.ValidationFailures,function(item){return item.IsAsync;}))});
            return deferred.promise;

        }
    }


    /**
     *
     * @ngdoc object
     * @name  Validator
     * @module Validation
     *
     *
     * @description
     * It represents a custom validator. It enables to define your own shared validation rules
     */
    export class Validator extends ValidationResult implements IValidator  {
        public Error: IError = new Error();

        constructor (public Name:string,private ValidateFce: IValidate) {
            super(Name);
        }
        public Optional:IOptional;
        public Validate(context:any) {
            this.ValidateFce.bind(context)(this.Error);
            return this.HasError;
        }

        public get HasError():boolean{
            return this.HasErrors;
        }



        public get HasErrors(): boolean {
            if (this.Optional != undefined && _.isFunction(this.Optional) && this.Optional()) return false;
            return this.Error.HasError;
        }

        public get ErrorCount(): number {
            return this.HasErrors ? 1 : 0;
        }
        public get ErrorMessage(): string {
            if (!this.HasErrors) return "";
            return this.Error.ErrorMessage;
        }

        public get TranslateArgs():Array<IErrorTranslateArgs> {
            if (!this.HasErrors) return [];
            var newArray = [];
            newArray.push(this.Error.TranslateArgs);
            return newArray;
        }
    }
}
//var _ = require('underscore');
//var Q = require('q');
//module.exports = Validation;