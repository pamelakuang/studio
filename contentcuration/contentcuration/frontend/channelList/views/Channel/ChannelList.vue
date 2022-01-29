<template>

  <VContainer fluid>
    <div>
      <ChannelListFilters
      v-if="isEditable && !loading"
      >
      </ChannelListFilters>
    </div>
    <VLayout row wrap justify-center>
      <VFlex xs12 sm10 md8 lg10>
        <VLayout>
          <VSpacer />
          <!-- Sorting -->
          <VContainer
            v-if="isEditable && !loading">
            <MultiSelect
              v-model="sortOptions"
              :items="sortingOptions"
              :label="$tr('sortLabel')"
              @input="selectOpt"
            />
          </VContainer>
        <VContainer>
          <VBtn
            v-if="isEditable && !loading"
            color="primary"
            class="add-channel-button"
            data-test="add-channel"
            @click="newChannel"
          >
            {{ $tr('channel') }}
          </VBtn>
        </VContainer>
        </VLayout>
      </VFlex>
    </VLayout>

    <VLayout row wrap justify-center>
      <VFlex xs12 sm10 md8 lg10>
        <VLayout row justify-center>
          <VFlex xs12>
            <LoadingText v-if="loading" />
            <p v-else-if="listChannels && !listChannels.length" class="headline mb-0">
              {{ $tr('noChannelsFound') }}
            </p>
            <template v-else>
              <ChannelItem
                v-for="channel in listChannels"
                :key="channel.id"
                :channelId="channel.id"
                allowEdit
                fullWidth
              />
            </template>
          </VFlex>
        </VLayout>
      </VFlex>
    </VLayout>
  </VContainer>

</template>


<script>

  import ChannelListFilters from './ChannelListFilters';
  import { mapGetters, mapActions } from 'vuex';
  //import sortBy from 'lodash/sortBy';
  import orderBy from 'lodash/orderBy';
  import MultiSelect from 'shared/views/form/MultiSelect';
  import { catalogFilterMixin } from './mixins';
  import { RouteNames, CHANNEL_PAGE_SIZE } from '../../constants';
  import ChannelItem from './ChannelItem';
  import LoadingText from 'shared/views/LoadingText';
  import { ChannelListTypes } from 'shared/constants';

  function listTypeValidator(value) {
    // The value must match one of the ListTypes
    return Object.values(ChannelListTypes).includes(value);
  }

  export default {
    name: 'ChannelList',
    components: {
      MultiSelect,
      ChannelListFilters,
      ChannelItem,
      LoadingText,
    },
    mixins: [catalogFilterMixin],
    props: {
      listType: {
        type: String,
        required: true,
        validator: listTypeValidator,
      },
    },
    data() {
      return {
        loading: false,
      };
    },
    computed: {
      ...mapGetters('channel', ['channels']),
      listChannels() {
        const channels = this.channels;
        const publish = this.$route.query.published;
        const unpublish = this.$route.query.unpublished;
        const sortOpt = String(this.$route.query.sortOptions).split(',');
        var dir = [];
        var sortFields = [];
        if (!channels) {
          return [];
        }
        // Checks to see if there are any sorting options are selected
        if (this.$route.query.sortOptions != undefined) {
          for (let i = 0; i < sortOpt.length; i++) {
            if (sortOpt[i] == 'modified') {
              sortFields.push('modified');
              dir.push('desc');
            }
            if (sortOpt[i] == '-modified') {
              sortFields.push('modified');
              dir.push('asc');
            }
            if (sortOpt[i] == '-name') {
              sortFields.push(user => user.name.toLowerCase());
              dir.push('desc');
            }
          }
          if (!sortOpt.includes('-name')) {
            sortFields.push(user => user.name.toLowerCase());
            dir.push('asc');
          }
        }
        // No sorting filters selected. So go by default sort
        else {
          sortFields = ['published', user => user.name.toLowerCase()];
          dir = ['asc'];
        }
        if (this.listType === ChannelListTypes.PUBLIC) {
          sortFields.unshift('-priority');
        }
        // Checks to see if published and unpublished checkboxes are selected
        if (publish && !unpublish) {
          return orderBy(
            this.channels.filter(channel => channel[ChannelListTypes.PUBLIC] && !channel.deleted),
            sortFields, dir
          );
        }
        if (!publish && unpublish) {
          return orderBy(
            this.channels.filter(channel => !channel[ChannelListTypes.PUBLIC] && !channel.deleted),
            sortFields, dir
          );
        }
        // Order in which channels are returned if published/unpublished checkboxes aren't selected
        return orderBy(
          this.channels.filter(channel => channel[this.listType] && !channel.deleted),
          sortFields, dir
        )
      },
      isEditable() {
        return this.listType === ChannelListTypes.EDITABLE;
      },
      isStarred() {
        return this.listType === ChannelListTypes.STARRED;
      },
      sortingOptions() {
        var options = [
          {
            'text': 'Name Z to A',
            'value': '-name',
          },
          {
            'text': 'Modified (latest to oldest)',
            'value': 'modified',
          },
          {
            'text': 'Modified (oldest to latest)',
            'value': '-modified',
          }
        ];
        return (
          options.map(o => {
            return {
              text: o.text,
              value: o.value,
            }
          })
        )
      }
    },
    watch: {
      listType(newListType) {
        this.loadData(newListType);
      },
      $route(to, from) {
        if (to.query.page !== from.query.page) {
          this.loadData(this.listType);
        }
      },
    },
    created() {
      this.loadData(this.listType);
    },
    methods: {
      ...mapActions('channel', ['loadChannelList', 'createChannel']),
      newChannel() {
        this.$analytics.trackClick('channel_list', 'Create channel');
        this.createChannel().then(id => {
          this.$router.push({
            name: RouteNames.CHANNEL_EDIT,
            params: { channelId: id, tab: 'edit' },
            query: { last: this.$route.name },
          });
        });
      },
      loadData(listType) {
        this.loading = true;
        let parameters = {
          listType,
          sortBy: '-modified',
        };

        // Don't paginate bookmarked channel list for more
        // rapid updating when channels are starred/unstarred
        if (!this.isStarred) {
          parameters.page = Number(this.$route.query.page || 1);
          parameters.page_size = CHANNEL_PAGE_SIZE;
        }

        this.loadChannelList({ listType }).then(() => {
          this.loading = false;
        });
      },
      selectOpt: function (e) {
        if (e.includes('modified')) {
          this.sortingOptions.forEach((item) => {
            if (item.value == '-modified') {
              item.disabled = true;
            }
          })
        }
        else if (!e.includes('modified')) {
          this.sortingOptions.forEach((item) => {
            if (item.value == '-modified') {
              item.disabled = false;
            }
          })
        }
        if (e.includes('-modified')) {
          this.sortingOptions.forEach((item) => {
            if (item.value == 'modified') {
              item.disabled = true;
            }
          })
        }
        else if (!e.includes('-modified')) {
          this.sortingOptions.forEach((item) => {
            if (item.value == 'modified') {
              item.disabled = false;
            }
          })
        }
      }
    },
    $trs: {
      noChannelsFound: 'No channels found',
      channel: 'New channel',
      sortLabel: 'Sort by',
    },
  };

</script>


<style lang="less" scoped>

  .add-channel-button {
    margin: 0;
  }

</style>
