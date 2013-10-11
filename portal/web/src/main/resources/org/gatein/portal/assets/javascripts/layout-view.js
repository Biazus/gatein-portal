(function() {
	var  LayoutView = Backbone.View.extend({
		el : '.editing',
		
        initialize : function() {
        	var editing = this.$el.hasClass("editing");
        	var view = this;
        	if (editing) {
        		this.$( ".sortable" ).sortable({
        			connectWith: ".sortable",
        			tolerance: "pointer",
        			placeholder: "portlet-placeholder",
        			revert: true,
        			update : function(event, ui) {
        				var dragObj = $(ui.item);
        	    		var cont = view.model.getDescendant(dragObj.closest('.sortable').attr('id'));
        	    		var prev = dragObj.prev('.portlet');
        	    		var idx = prev.length ? $('#' + cont.getId() + ' > .portlet').index(prev.get(0)) + 1 : 0;
        	    		
        	    		cont.addChild(ui.item.attr('id'), {at : idx});
        	    	}
        		});
                this.$("#saveLayout").off().click(function(){
                    view.model.save().done(function($data){
                        if($data.code == 200) {
                            $url = _.result(view.model, 'url');
                            window.location.href = $url;
                        } else {
                            alert("error: " + data.message);
                        }
                    }).error(function($error){
                        alert("error on connect to server");
                    });
                    return false;
                });
        	}
        	this.listenTo(this.model, 'addChild.eXo.Container', this.onAddChild);
        	this.listenTo(this.model, 'removeChild.eXo.Container', this.onRemoveChild);
        },
        
        onAddChild : function(child, container) {
        	var $cont = $('#' + container.getId());
        	var $app = $('#' + child.getId());
        	var prev = container.at(child.getIndex() - 1);
        	if (prev) {
        		$app.insertAfter($('#' + prev.getId()));
        	} else {
        		$cont.prepend($app);
        	}
        	$cont.removeClass('emptyContainer');
        },
        
        onRemoveChild : function(child, container) {
        	var $cont = $("#" + container.getId());
        	var $app = $cont.children('#' + child.getId());
        	$app.remove();
        	
        	if (container.isEmpty()) {
        		$cont.addClass('emptyContainer');
        	}
        }
	});
	
	//Bootstrap view and model of the editor 
	$(function() {
		var root = $('.editing');
		var url = root.attr('data-editURL');
		
		var container = new PageContainer();
        container.setUrlRoot(url);
		$('.sortable').each(function() {
			var cont = new Container({id : this.id});			
			$(this).children('.portlet').each(function() {			
				var app = new Application({'id' : this.id});
				cont.addChild(app);
			});
			container.addChild(cont);
		});
		
		window.layoutView = new LayoutView({model : container});
		
		//switch layout
		$('.switch').each(function() {
			var href = $(this).attr('href');
			$(this).on('click', function(e) {
				e.preventDefault();
				$.ajax({
						url : href,
						dataType : "json",
						success: function(result) {
                            if(result.code != 200) {
                                alert("change layout failure!");
                                return false;
                            }

                            var resultData = result.data;

                            //Init new model
							var newContainer = new PageContainer();
                            newContainer.setUrlRoot(url);
                            if(resultData.layout_id) {
                                newContainer.setLayoutId(resultData.layout_id);
                            }

                            var data = resultData.html;
							$(data).find('.sortable').each(function() {
								var cont = new Container({id : this.id});
								newContainer.addChild(cont);
							});
							
							var pageBody = $('.pageBody');
							pageBody.find('.sortable').each(function() {
								var id = $(this).attr('id');
								$(this).attr('id', id + '-old');
							});
							var oldLayout = $('<div></div>').hide().html(pageBody.html());
							$(pageBody).html(data);
							$('.container').append(oldLayout);
							
							var container = window.layoutView.model;
							window.layoutView = new LayoutView({model : newContainer});
							
							$(container.get("_childrens").models).each(function() {
									var apps = this.get("_childrens").models;
									var id = this.id;
									var cont = this;
									$(apps).each(function() {
										var newCont = newContainer.getChild(id);
										if (newCont) {
											newCont.addChild(this);
										} else {
											//Add applications into last container
											var lastId = newContainer.get("_childrens").length;
											newCont = newContainer.getChild(lastId);
											newCont.addChild(this);
										}
									});
							});
							
							//remove old container
							oldLayout.remove();
						}
				});
			});
		});
		//end switch layout
		
	});
})();