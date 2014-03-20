define(function(require) {
  //________________________________________________________________________________________
  // GeneBank

  var FT_base = require('lib/files/base'),
      FT_genebank;

  FT_genebank = function() {
    this.typeName = 'GeneBank' ;
  }

  FT_genebank.prototype = new FT_base() ;

  /**
    Implements a GenBank format file reader/writer.
    @class FT_genebank
    @extends Filetype
  */
  FT_genebank.prototype.constructor = FT_genebank ;

  FT_genebank.prototype.textHeuristic = function () {
    if ( this.text.match ( /^LOCUS\s+/i ) ) return true ;
    return false ;
  }


  FT_genebank.prototype.parseText = function ( text ) {
    this.text = text ;
    this.fileTypeValidated = true ;
  //  $('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
    this.parseFile () ;
  }

  FT_genebank.prototype.parseFile = function () {
    var ret = [] ;
    var lines = this.text.replace(/\r/g,'').split ( "\n" ) ;

    var mode = '' ;
    var seq = new SequenceDNA ( '' , '' ) ;
    seq.desc = '' ;
    var feature = {} ;
    $.each ( lines , function ( k , v ) {

      if ( v.match(/^LOCUS/i) ) {
        var m = v.match(/^LOCUS\s+(\S+)\s+(.+)$/i)
        seq.name = m[1] ;
        seq.is_circular = m[2].match(/\bcircular\b/i) ? true : false ;
        return ;
      } else if ( v.match(/^DEFINITION\s+(.+)$/i) ) {
        var m = v.match(/^DEFINITION\s+(.+)$/i) ;
        seq.name = m[1] ;
      } else if ( v.match(/^FEATURES/i) ) {
        mode = 'FEATURES' ;
        return ;
      } else if ( v.match(/^REFERENCE/i) ) {
        mode = 'REFERENCE' ;
        return ;
      } else if ( v.match(/^COMMENT\s+(.+)$/i) ) {
        mode = 'COMMENT' ;
        var m = v.match(/^COMMENT\s+(.+)$/i) ;
        seq.desc += m[1] + "\n" ;
        return ;
      } else if ( v.match(/^ORIGIN/i) ) {
        if ( feature['_last'] ) seq.features.push ( $.extend(true, {}, feature) ) ;
        mode = 'ORIGIN' ;
        return ;
      }
      
      if ( mode == 'FEATURES' ) { // Note that leading spaces have some "leeway"...
      
        var m = v.match ( /^\s{1,8}(\w+)\s+(.+)$/ ) ;
        if ( m ) { // Begin feature
          if ( feature['_last'] ) seq.features.push ( $.extend(true, {}, feature) ) ;
          feature = {} ;
          feature['_type'] = m[1] ;
          feature['_range'] = m[2] ;
          feature['_last'] = '_range' ;
          return ;
        }
        
        m = v.match ( /^\s{8,21}\/(\w+)\s*=\s*(.+)\s*$/ ) ;
        if ( m ) { // Begin new tag
          m[1] = m[1].replace ( /^"/ , '' ) ;
          feature['_last'] = m[1] 
          feature[m[1]] = m[2] ;
          return ;
        }
        
        m = v.match ( /^\s{18,21}\s*(.+)\s*$/ ) ;
        if ( m ) { // Extend tag
          //if ( null !== feature[feature['_last']].match(/^[A-Z]+$/) )
          m[1] = m[1].replace ( /"$/ , '' ) ;
          if ( m[1].match(/^[A-Z]+$/) === null ) feature[feature['_last']] += " " ;
          feature[feature['_last']] += m[1] ;
        }
      
      } else if ( mode == 'REFERENCE' ) {
        seq.desc += v + "\n" ;
      
      } else if ( mode == 'ORIGIN' ) {
      
        if ( v.match(/^\/\//) ) return false ; // The absolute end
        seq.seq += v.replace ( /[ 0-9]/g , '' ).toUpperCase() ;
        
      }
    } ) ;
    
    // Cleanup features
    $.each ( seq.features , function ( k , v ) {
      delete v['_last'] ;
      var range = [] ; // Default : Unknown = empty TODO FIXME
      var r = v['_range'] ;
      
      var m = r.match ( /^\d+$/ ) ;
      if ( m ) {
        range.push ( { from : r*1 , to : r*1 , rc : false } ) ;
        v['_range'] = range ;
        return ;
      }
      
      m = r.match ( /^(\d+)\.\.(\d+)$/ ) ;
      if ( m ) {
        range.push ( { from : m[1]*1 , to : m[2]*1 , rc : false } ) ;
        v['_range'] = range ;
        return ;
      }
      
      m = r.match ( /^complement\((\d+)\.\.(\d+)\)$/i ) ;
      if ( m ) {
        range.push ( { from : m[1]*1 , to : m[2]*1 , rc : true } ) ;
        v['_range'] = range ;
        return ;
      }
      
      console.log ( "Could not parse range " + r ) ;
      v['_range'] = range ;
    } ) ;
    
  //  console.log ( JSON.stringify ( seq.features ) ) ;
    
    var seqid = gentle.addSequence ( seq , true ) ;
    ret.push ( seqid ) ;
    return ret ;
  }

  return FT_genebank;
});