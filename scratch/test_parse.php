<?php
parse_str('items=JSONSTRING&items[0][id]=1&items[1][id]=2&items[2][id]=3', $out1);
print_r($out1);

parse_str('items[0][id]=1&items[1][id]=2&items[2][id]=3&items=JSONSTRING', $out2);
print_r($out2);
