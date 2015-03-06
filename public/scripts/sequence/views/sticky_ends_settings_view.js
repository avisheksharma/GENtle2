import Backbone from 'backbone';
import Gentle from 'gentle';
import template from '../templates/sticky_ends_settings_view.hbs';


export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'change input': 'onChange'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.onChange = _.throttle(_.bind(this.onChange, this), 250);
  },

  afterRender: function() {
    this.setFormData('start', this.model.get('stickyEnds.start'));
    this.setFormData('end', this.model.get('stickyEnds.end'));
  },

  getField: function(position, name) {
    return this.$(`#stickyEnd_${position}_${name}`);
  },

  getFormData: function(position) {
    return {
      enabled: this.getField(position, 'enabled').is(':checked'),
      name: this.getField(position, 'name').val(),
      reverse: this.getField(position, 'reverse').is(':checked'),
      size: Number(this.getField(position, 'size').val()),
      offset: Number(this.getField(position, 'offset').val())
    };
  },

  setFormData: function(position, stickyEnd) {
    if(stickyEnd) {
      this.getField(position, 'enabled').prop('checked', 'checked'); 
      this.getField(position, 'reverse').prop('checked', stickyEnd.reverse ? 'checked' : null);
      this.getField(position, 'name').val(stickyEnd.name);
      this.getField(position, 'size').val(stickyEnd.size);
      this.getField(position, 'offset').val(stickyEnd.offset);
    } else {
      this.getField(position, 'enabled').prop('checked', null); 
    }
  },

  onChange: function(event) {
    event.preventDefault();
    var data = {};
    var startData = this.getFormData('start');
    var endData = this.getFormData('end');

    var extract = function(data_) {
      return _.pick(data_, 'name', 'reverse', 'offset', 'size');
    };

    if(startData.enabled) {
      data.start = extract(startData);
    } 

    if(endData.enabled) {
      data.end = extract(endData);
    }

    this.model.set('stickyEnds', data).throttledSave();
    this.model.trigger('change:sequence');
  }

});