import type { Schema, Struct } from '@strapi/strapi';

export interface SharedButton extends Struct.ComponentSchema {
  collectionName: 'components_shared_buttons';
  info: {
    displayName: 'Button';
    icon: 'link';
  };
  attributes: {
    button_label: Schema.Attribute.String;
    button_link: Schema.Attribute.String;
  };
}

export interface SharedInnerBanner extends Struct.ComponentSchema {
  collectionName: 'components_shared_inner_banners';
  info: {
    displayName: 'Inner banner';
  };
  attributes: {
    banner_bg: Schema.Attribute.Media<'images' | 'videos'>;
    banner_label: Schema.Attribute.String;
    banner_title: Schema.Attribute.String;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSectionTitle extends Struct.ComponentSchema {
  collectionName: 'components_shared_section_titles';
  info: {
    displayName: 'Section Title';
    icon: 'code';
  };
  attributes: {
    description: Schema.Attribute.Text;
    sub_title: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedServiceCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_service_cards';
  info: {
    displayName: 'Service Card';
  };
  attributes: {
    button_label: Schema.Attribute.String;
    button_link: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    svg: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.button': SharedButton;
      'shared.inner-banner': SharedInnerBanner;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.section-title': SharedSectionTitle;
      'shared.seo': SharedSeo;
      'shared.service-card': SharedServiceCard;
      'shared.slider': SharedSlider;
    }
  }
}
