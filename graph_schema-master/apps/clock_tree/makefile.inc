

$(eval $(call provider_rules_template,clock_tree))

define clock_tree_instance_template
# $1 = D_B  (depth and branching)
# $2 = max-steps
# $3 = filters

demos/clock_tree/clock_tree_$1.xml : apps/clock_tree/create_clock_tree_instance.py apps/clock_tree/clock_tree_graph_type.xml
	mkdir -p $$(dir $$@)
	$$(PYTHON) apps/clock_tree/create_clock_tree_instance.py apps/clock_tree/clock_tree_graph_type.xml $$(subst _, ,$1) > $$@

demos/clock_tree/clock_tree_$1.snap : demos/clock_tree/clock_tree_$1.xml bin/epoch_sim clock_tree_provider demos/clock_tree/clock_tree_$1.checked
	bin/epoch_sim --max-steps $2 --snapshots 1 $$@  demos/clock_tree/clock_tree_$1.xml

demos/clock_tree/clock_tree_$1.mp4 : demos/clock_tree/clock_tree_$1.xml demos/clock_tree/clock_tree_$1.snap clock_tree_provider
	mkdir -p demos/clock_tree/clock_tree_$1.tmp
	$(PYTHON) tools/render_graph_as_dot.py demos/clock_tree/clock_tree_$1.xml --snapshots demos/clock_tree/clock_tree_$1.snap --output demos/clock_tree/clock_tree_$1.tmp/out  \
		$3
	(cd demos/clock_tree/clock_tree_$1.tmp/  &&  for i in *.dot; do echo $$$$i; neato -Nlabel="" -Gsize=5,5\! -Gdpi=100 -Tpng $$$$i > $$$$i.png; done )
	(cd demos/clock_tree/clock_tree_$1.tmp/  && convert -delay 20 -loop 0 *.dot.png ../../clock_tree_$1.gif)
	(cd demos/clock_tree/clock_tree_$1.tmp/  && $(FFMPEG) -r 10 -i out_%06d.dot.png -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 18 ../clock_$1.mp4)

clock_tree_demos : demos/clock_tree/clock_tree_$1.mp4

ALL_DEMOS += clock_tree_demos

endef

CLOCK_TREE_FILTERS = \
	--bind-dev "branch" "state" "pending" "color" "blend_colors( (255,255,0), (255,0,255), 0, 2, value)" \
	--bind-dev "leaf" "rts" "-" "color" "'red' if value>0 else 'green'" \

$(eval $(call clock_tree_instance_template,8_2,50,$(CLOCK_TREE_FILTERS)))
$(eval $(call clock_tree_instance_template,6_3,50,$(CLOCK_TREE_FILTERS)))
$(eval $(call clock_tree_instance_template,4_4,50,$(CLOCK_TREE_FILTERS)))
